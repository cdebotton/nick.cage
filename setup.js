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

switch(mode) {
  case 'build:vendor':
    // Build handlebars.
    run('cd ./bower_components/handlebars.js;', ' npm install;')
      .then(function() {
        return run('cd ./bower_components/handlebars.js;', 'grunt build;');
      })
      .then(function() {
        console.log('Handlebars.js successfully built.');
      })
    // Build ember.
      .then(function() {
        return run('cd ./bower_components/ember.js;', 'bundle install;');
      })
      .then(function() {
        return run('cd ./bower_components/ember.js;', 'npm install;');
      })
      .then(function() {
        return run('cd ./bower_components/ember.js;', 'rake dist;');
      })
    // Build ember-data.
      .then(function() {
        return run('cd ./bower_components/data;', 'bundle;');
      })
      .then(function() {
        return run('cd ./bower_components/data;', 'npm install;');
      })
      .then(function() {
        return run('cd ./bower_components/data;', 'rake dist;');
      })
    // Copy font-awesome assets.
      .then(function() {
        return run('cp -r ./bower_components/font-awesome/fonts', './app/assets/fonts');
      });
    break;
}
