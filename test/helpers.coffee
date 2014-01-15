require 'initialize'

Ember.Test.adapter = Ember.Test.MochaAdapter.create()

document.write '<div id="ember-testing"></div>'

App.rootElement = '#ember-testing'

App.setupForTesting()
App.injectTestHelpers()

