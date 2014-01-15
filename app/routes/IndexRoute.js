'use strict';

module.exports = App.IndexRoute = Ember.Route.extend({
  setupController: function(controller) {
    controller.set('content', ['red', 'yellow', 'blue']);
  }
});
