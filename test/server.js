var assert  = require('assert')
  , express = require('express')
  , http    = require('http')
  , sinon   = require('sinon')
  , rip     = require('../server')
  , mysql   = require('mysql')
  , app
  , server
  , ripple
  , Browser = require('zombie')

describe('Ripple Server', function(){

  beforeEach(function(done){
    app = server = ripple = null    
    app = express()
    server = http.createServer(app)
    ripple = rip(server, app)
    
    var query = sinon.stub().callsArgWith(1, 0, [1,2,3])
    mysql.createPool = sinon.stub().returns({ query: query })
    
    done()
  })

  it('should have standard and shortcut functions', function(){  
    assert.equal('function', typeof ripple.db)  
    assert.equal('function', typeof ripple.resource)  
  })

  it('should add a resource', function(){  
    ripple
      .db()
      .resource('some.data')

    assert.equal(3, ripple('some.data').length)
    assert.equal('function', typeof ripple('some.data').push)
    assert.equal('function', typeof ripple('some.data').remove)
  })

  it('should update/CRUD a resource', function(){
    ripple
      .db()
      .resource('some.data')

    // ripple('some.data')[0] = 5
    // assert.equal([5,2,3], ripple('some.data'))

    // ripple('some.data').push(7)
    // assert.equal(4, ripple('some.data').length)

    ripple('some.data').remove(0)
    assert.equal(3, ripple('some.data').length)

    // ripple('some.data')[0] = {'venue': 'Campus B', 'time': '2014-11-14_2000GMT'}
    // assert('Campus B', ripple('some.data')[0]['venue'])
  })

  it('can restrict CRUD ops with permissions', function(){
    ripple
      .db()
      .resource('some.data', undefined, undefined, {
          'create' : function(){ return false }
        , 'read' : function(){ return false }
        , 'update' : function() { return false }
        , 'delete' : function() { return false }
      })

    //check cannot read 
    assert.equal(0, ripple('some.data').length)

    //check create failure
    ripple('some.data').push(7)
    assert.equal(3, ripple._resources()['some.data'].length)

    //check delete failure
    ripple('some.data').remove(0)
    assert.equal(3, ripple._resources()['some.data'].length)
  })

})


describe('Ripple Client', function(){
  beforeEach(function(done){
    app = server = ripple = null    
    app = express()
    server = http.createServer(app)
    ripple = rip(server, app)


    app.use(express.static(__dirname+'/public'))
    app.get('/hello', function(req, res){
      res.send('hello')
    })

    var query = sinon.stub().callsArgWith(1, 0, [1,2,3])
    mysql.createPool = sinon.stub().returns({ query: query })

    server.listen(3000)
    browser = new Browser({ site: 'http://localhost:3000/hello'})
    
    done()
  })
  
  it('should receive a resource', function(){  
    ripple
      .db()
      .resource('some.data')

     assert.equal(3, browser.evaluate('ripple("some.data")').length)
  })

  it('should add a resource', function(){
    ripple
      .db()
      .resource('some.data')

    var fut = browser.evaluate('ripple("some.data").push(15)')
    console.log(fut)
    assert.equal(4, browser.evaluate('ripple("some.data")').length)
  })

})
