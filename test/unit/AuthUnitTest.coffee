'use strict'

describe 'Em.Auth', ->
  auth = null
  spy = null
  server = null
  responseHeader = { 'Content-Type': 'application/json' }

  Em.Auth.reopen
    storageKey: 'united-admin.test'

  before ->

  after ->


  beforeEach ->
    server = sinon.fakeServer.create()
    auth = App.__container__.lookup 'auth:main'
    auth._defaults = {}
    for key, handlers of auth.get '_handlers'
      handlers.removeObject handler for handler in handlers

  afterEach ->
    auth.set 'signedIn', false
    Ember.run -> auth?.destroy()
    sinon.collection.restore()
    server.restore()
    App.reset()
    spy = null
    localStorage.removeItem('united-admin.test.authToken');

  it 'should extend Ember.Object', ->
    auth.should.be.an.instanceOf Ember.Object

  it 'should have an empty defaults object', ->
    auth._defaults.should.deep.equal {}

  it 'should be injected into routes', ->
    App.InjectionTestRoute = Em.Route.extend()
    route = App.__container__.lookup 'route:injection-test'
    route.auth.should.equal auth

  it 'should be injected into controllers', ->
    App.InjectionTestController = Em.ObjectController.extend()
    controller = App.__container__.lookup 'controller:injection-test'
    controller.auth.should.equal auth

  it 'should be injected into views', ->
    App.InjectionTestView = Em.View.extend()
    view = App.__container__.lookup 'view:injection-test'
    view.auth.should.equal auth

  it 'should be injected into components', ->
    App.InjectionTestComponent = Em.Component.extend()
    component = App.__container__.lookup 'component:injection-test'
    component.auth.should.equal auth

  describe '#_configure', ->
    it 'adds namedspaced properties', ->
      auth._configure 'foo', { bar: 'baz' }
      auth._defaults.should.deep.equal { foo: { bar: 'baz' } }

    it 'extends existing namespaced properties', ->
      auth._defaults = { foo: { bar: 'baz' } }
      auth._configure 'foo', { bar2: 'bar2' }
      auth._defaults.should.deep.equal { foo: { bar: 'baz', bar2: 'bar2' } }

  describe '#_handlers', ->
    it 'should have a handlers collection', ->
      auth._handlers.should.be.an 'object'

    it 'should add handlers with #addHandler', ->
      handler = ->
      auth.addHandler 'signInSuccess', handler
      auth.get('_handlers').signInSuccess.objectAt(0).should.equal handler

    it 'should throw an error if an unrecognized handler type is added', ->
      auth.addHandler.bind(auth, 'someNewType', ->).should.throw Ember.Error

    it 'should throw an error if the handler passed in is not a function', ->
      auth.addHandler.bind(auth, 'signInSuccess').should.throw Ember.Error

    it 'should remove handler when function is provided', ->
      auth.addHandler 'signInSuccess', foo = -> 'foo'
      auth.addHandler 'signInSuccess', bar = -> 'bar'
      auth.get('_handlers').signInSuccess.objectAt(0).should.equal foo

    it 'should call handlers on #signInSuccess', ->
      server.respondWith 'POST', '/foo', [200, responseHeader, '[]']
      spy = sinon.collection.spy()
      auth.addHandler 'signInSuccess', spy
      Ember.run -> auth.signIn '/foo', {}
      server.respond()
      spy.should.have.been.calledOnce

    it 'should call handlers on #signInError', ->
      server.respondWith 'POST', '/bar', [404, responseHeader, '[]']
      spy = sinon.collection.spy()
      auth.addHandler 'signInError', spy
      Ember.run -> auth.signIn '/bar', {}
      server.respond()
      spy.should.have.been.calledOnce

  describe '#signIn', ->
    it 'should make an xhr request using jQuery#ajax', ->
      spy = sinon.collection.spy Em.$, 'ajax'
      Em.run -> auth.signIn 'foo', {}
      spy.should.have.been.calledWith { dataType: 'json', url: '/foo', type: 'POST' }
      server.respond()

    it '#_createSession should be called on signInSuccess', ->
      spy = sinon.collection.spy auth, '_createSession'
      server.respondWith 'POST', '/foo', [200, responseHeader, '{"auth_token": "test", "user_id": "1"}']
      Em.run -> auth.signIn 'foo', {}
      server.respond()
      spy.should.have.been.calledOnce

    it 'should sign the user in on signInSuccess', ->
      server.respondWith 'POST', '/api/sign-in', [200, responseHeader, '{"user_id": "1", "auth_token": "foo"}']
      Em.run -> auth.signIn {}
      server.respond()
      auth.get('signedIn').should.be.true

  describe '#_createSession', ->
    it 'should store the auth_token in localStorage', ->
      auth._createSession { auth_token: 'test' }
      localStorage.getItem('united-admin.test.authToken').should.equal 'test'

  describe '#_destroySession', ->
    it 'should destroy the localStorage key.', ->
      auth._createSession { auth_token: 'test' }
      auth._destroySession()
      expect(localStorage.getItem('united-admin.test.authToken')).to.be.null

  describe '#signOut', ->
    it 'should send an xhr delete request to /api/sign-out', ->
      spy = sinon.collection.spy Em.$, 'ajax'
      Em.run -> auth.signOut()
      spy.should.have.been.calledWith { dataType: 'json', url: '/api/sign-out', type: 'DELETE' }

    it 'should call #_destroySession', ->
      spy = sinon.collection.spy auth, '_destroySession'
      server.respondWith 'DELETE', '/api/sign-out', [200, responseHeader, '[]']
      Em.run -> auth.signOut()
      server.respond()
      spy.should.have.been.calledOnce

    it 'should call signOutSuccess handlers', ->
      server.respondWith 'DELETE', '/api/sign-out', [200, responseHeader, '[]']
      spy = sinon.collection.spy()
      auth.addHandler 'signOutSuccess', spy
      Em.run -> auth.signOut()
      server.respond()
      spy.should.have.been.calledOnce

    it 'should call signOutError handlers', ->
      server.respondWith 'DELETE', '/api/sign-out', [404, responseHeader, '[]']
      spy = sinon.collection.spy()
      auth.addHandler 'signOutError', spy
      Em.run -> auth.signOut()
      server.respond()
      spy.should.have.been.calledOnce

    it 'should sign the user out', ->
      server.respondWith 'POST', '/api/sign-in', [200, responseHeader, '{"user_id": "1", "auth_token": "foo"}']
      Em.run -> auth.signIn()
      server.respond()
      server.respondWith 'DELETE', '/api/sign-out', [200, responseHeader, '[]']
      Em.run -> auth.signOut()
      server.respond()
      auth.get('signedIn').should.be.false
