'use strict';

exports.config = {
  files: {
    javascripts: {
      joinTo: {
        'javascripts/app.js': /^app/,
        'javascripts/vendor.js': /^(bower_components|vendor)/
      },
      order: {
        before: [
          'bower_components/jquery/jquery.js',
          'vendor/javascripts/handlebars.js',
          'vendor/javascripts/ember.js',
          'vendor/javascripts/ember-data.js'
        ]
      }
    },
    stylesheets: {
      joinTo: {
        'stylesheets/app.css': /^(bower_components|app)/
      }
    },
    templates: {
      defaultExtension: 'emblem',
      precompile: true,
      root: 'templates/',
      joinTo: {
        'javascripts/app.js': /^app/
      },
      paths: {
        jquery: 'bower_components/jquery/jquery.js',
        handlebars: 'vendor/javascripts/handlebars.js',
        ember: 'vendor/javascripts/ember.js',
        emblem: 'bower_components/emblem.js/emblem.js'
      }
    }
  }
};
