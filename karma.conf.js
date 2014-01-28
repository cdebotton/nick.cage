'use strict';

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai'],
    files: [
      'public/javascripts/vendor.js',
      'bower_components/ember-mocha-adapter/adapter.js',
      'bower_components/sinonjs/sinon.js',
      'node_modules/sinon-chai/lib/sinon-chai.js',
      'public/javascripts/app.js',
      'test/helpers.coffee',
      'test/**/*Test.coffee'
    ],
    exclude: [],
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    captureTimeout: 60000,
    singleRun: false,
    plugins: [
      'karma-mocha',
      'karma-chai',
      'karma-coffee-preprocessor',
      'karma-phantomjs-launcher',
      'karma-mocha-reporter'
    ],
    preprocessors: {
      "**/*.coffee": "coffee"
    }
  });
};
