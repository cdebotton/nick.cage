'use strict';

window.App = require('config/app');
require('config/router');
require('config/store');

var folderOrder = [
    'lib', 'initializers', 'mixins', 'routes', 'models',
    'views', 'controllers', 'helpers',
    'templates', 'components'
  ];

folderOrder.forEach(function(folder) {
  window.require.list().filter(function(module) {
    return new RegExp('^' + folder + '/').test(module);
  }).forEach(function(module) {
    require(module);
  });
});

App.Auth = Em.Auth.extend({

});
