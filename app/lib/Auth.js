'use strict';

Em.onLoad('Ember.Application', function(application) {
  application.initializer({
    name: 'ember-auth',
    initialize: function(container, app) {
      app.register('auth:main', app.Auth || Em.Auth, { singleton: true });
      app.inject('route', 'auth', 'auth:main');
      app.inject('controller', 'auth', 'auth:main');
      app.inject('view', 'auth', 'auth:main');
      app.inject('component', 'auth', 'auth:main');
    }
  });

  application.initializer({
    name: 'ember-auth-load',
    after: 'ember-auth',
    initialize: function(container, app) {
      return container.lookup('auth:main');
    }
  });
});

Em.Auth = Em.Object.extend({
  _defaults: {},

  _handlers: {
    signInSuccess: [],
    signInError: [],
    signOutSuccess: [],
    signOutError: [],
    sendSuccess: [],
    sendError: []
  },

  init: function() {
    this._super();
    if ('localStorage' in window) {
      var key = localStorage.getItem(this.get('_storageKey'));
      if (key) this.validateToken(key);
    }
  },

  _configure: function(namespace, options) {
    this.get('_defaults')[namespace] || (this.get('_defaults')[namespace] = {});
    this.get('_defaults')[namespace] = Em.$.extend(true, options, this.get('_defaults')[namespace]);
  },

  addHandler: function(type, callback) {
    Em.assert('Handler type unrecognized; You provided `%@`'.fmt(type), this.get('_handlers')[type]);
    Em.assert('Handler must be a function, you provided `%@`'.fmt(typeof callback), typeof callback === 'function');
    this.get('_handlers')[type].pushObject(callback);
  },

  validateToken: function (token) {
    var opts = { type: 'POST', dataType: 'json', data: { authToken: token } },
        settings = this.resolveSettings(opts),
        this$ = this;

    settings.url = this.resolveUrl(this.get('tokenValidationEndPoint'));
    return new Em.RSVP.Promise(function(resolve, reject) {
      Em.$.ajax(settings)
        .then(function(data) {
          var promises = [];
          promises.push(this$._createSession(data));
          promises.push(this$._signIn(data));
          this$.get('_handlers').signInSuccess.forEach(function(item, key) {
            promises.push(item.call(this$, data));
          });
          return Ember.RSVP.all(promises).then(
            function() { return resolve(data); },
            function() { return reject(data); }
          );
        }, function(jqxhr) {
          this$._destroySession(token);
          reject(token);
        });
    });
  },

  signIn: function(url, options) {
    if (typeof options === 'undefined') {
      options = url;
      url = this.get('signInEndPoint');
    }
    options || (options = {});
    options.type = 'POST';
    var settings = this.resolveSettings(options, this.resolveUrl(url)),
        this$ = this;
    return new Em.RSVP.Promise(function(resolve, reject) {
      return Em.$.ajax(settings)
        .then(function(data) {
          var promises = [];
          promises.push(this$._createSession(data));
          promises.push(this$._signIn(data));
          this$.get('_handlers').signInSuccess.forEach(function(item, key) {
            promises.push(item.call(this$, data));
          });
          return Ember.RSVP.all(promises).then(
            function() { return resolve(data); },
            function() { return reject(data); });
        }, function(jqxhr) {
          var promises = [];
          this$.get('_handlers').signInError.forEach(function(item, key) {
            promises.push(item.call(this$, jqxhr));
          });
          return Ember.RSVP.all(promises).then(
            function() { return reject(jqxhr.responseText); },
            function() { return reject(jqxhr.responseText); });
        });
    });
  },

  signOut: function(url, options) {
    if (typeof options === 'undefined') {
      options = url;
      url = this.get('signOutEndPoint');
    }
    options || (options = {});
    options.type = 'DELETE';
    var settings = this.resolveSettings(options, this.resolveUrl(url)),
        this$ = this;
    return new Em.RSVP.Promise(function(resolve, reject) {
      return Em.$.ajax(settings)
        .then(function(data) {
          var promises = [];
          promises.push(this$._destroySession());
          promises.push(this$._signOut());
          this$.get('_handlers').signOutSuccess.forEach(function(item, key) {
            promises.push(item.call(this$, data));
          });
          return new Em.RSVP.all(promises).then(
            function() { resolve(data); },
            function() { reject(data); }
          );
        }, function(jqxhr) {
          var promises = [];
          this$.get('_handlers').signOutError.forEach(function(item, key) {
            promises.push(item.call(this$, jqxhr));
          });
          return new Em.RSVP.all(promises).then(
            function() { reject(jqxhr); },
            function() { reject(jqxhr); }
          );
        });
    });
  },

  _signIn: function(data) {
    if (! data.user_id) return false;
    this.set('userId', data.user_id);
    this.set('signedIn', true);
  },

  _signOut: function() {
    this.set('userId', null);
    this.set('signedIn', false);
  },

  _storageKey: function() {
    return [this.get('storageKey'), 'authToken'].join('.');
  }.property('storageKey'),

  _createSession: function(data) {
    var authToken = data.auth_token;
    if ('localStorage' in window) {
      localStorage.setItem(this.get('_storageKey'), authToken);
    }
  },

  _destroySession: function() {
    if ('localStorage' in window) {
      if (! localStorage.getItem(this.get('_storageKey'))) return;
      localStorage.removeItem(this.get('_storageKey'));
    }
  },

  resolveUrl: function(path) {
    var base = this.get('baseUrl');
    if (base && base[base.length - 1] === '/') {
      base = base.substr(0, base.length - 1);
    }
    if (path && path[0] === '/') {
      path = path.substr(1, path.length);
    }
    return [base, path].join('/');
  },

  resolveSettings: function(params, path) {
    if (params.data && !params.contentType) {
      if (params.type && params.type.toUpperCase() !== 'GET') {
        params.data = JSON.stringify(params.data);
        params.contentType = 'application/json; charset=utf-8';
      }
    }

    return $.extend(true, {url:path, dataType:'json'}, params);
  }
});

Em.Auth.reopen({
  storageKey: 'united-admin',
  signedIn: false,
  userId: null,
  signInEndPoint: '/api/sign-in',
  signOutEndPoint: '/api/sign-out',
  tokenValidationEndPoint: '/api/validate-token'
});
