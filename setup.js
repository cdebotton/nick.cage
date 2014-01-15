'use strict';

var exec      = require('child_process').exec,
    sysPath   = require('path'),
    fs        = require('fs'),
    mode      = process.argv[2],
    deferred  = require('deferred');

var getBinaryPath = function(binary) {
  var path;
  if (fsExistsSync(
      path = sysPath.join('node_modules', '.bin', binary))) return path;
  if (fsExistsSync(path = sysPath.join('..', '.bin', binary))) return path;
  return binary;
};

var run = function(path, params, callback) {
  callback = callback || function() {};
  var command = path + ' ' + params,
      def = deferred();

  console.log('executing', command);
  exec(command, function(error, stdout, stderr) {
    if (error != null) return process.stderr.write(stderr.toString());
    console.log(stdout.toString());
    def.resolve(callback.call(null));
  });

  return def.promise;
};

var curl  = function(params, callback) {
  return run.call(this, 'curl', params, callback);
};

var cp = function(params, callback) {
  return run.call(this, 'cp -r', params, callback);
};

var DIST_URLS = {
  EMBER: 'http://builds.emberjs.com/release/ember.js',
  EMBER_DATA: 'http://builds.emberjs.com.s3.amazonaws.com/ember-data-latest.js',
  HANDLEBARS: 'http://builds.handlebarsjs.com.s3.amazonaws.com/handlebars-latest.js'
}

switch(mode) {
  case 'build:vendor':
    curl(DIST_URLS.EMBER + ' > vendor/javascripts/ember.js')
    .then(function() {
      return curl(DIST_URLS.EMBER_DATA + ' > vendor/javascripts/ember-data.js');
    })
    .then(function() {
      return curl(DIST_URLS.HANDLEBARS + ' > vendor/javascripts/handlebars.js');
    });
     cp('./bower_components/font-awesome/fonts ./app/assets/fonts')
     .then(function() { console.log('Vendor assets have been built.');  });
    break;
}
