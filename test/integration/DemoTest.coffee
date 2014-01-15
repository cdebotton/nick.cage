describe '/', ->
  beforeEach ->
    App.reset()

  it 'should render a header', ->
    visit('/').then ->
      find('h1').text().should.equal 'Welcome to Ember.js'
  it 'should have three list items', ->
    visit('/').then ->
      find('li').length.should.equal 3
