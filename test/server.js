var assert  = require('assert')
  , express = require('express')
  , http    = require('http')
  , sinon   = require('sinon')
  , rip     = require('../server')
  , app
  , server
  , ripple
  , Mocha = require('mocha')
  , mocha = new Mocha

describe('Ripple Server', function(){

  beforeEach(function(done){
    app = server = ripple = null    
    app = express()
    server = http.createServer(app)
    ripple = rip(server, app)
    
    ripple
      .resource('some.data', [1,2,3])

    done()
  })

  it('should have standard and shortcut functions', function(){  
    assert.equal('function', typeof ripple.db)  
    assert.equal('function', typeof ripple.resource)  
  })

  it('should register a resource', function(){  
    assert.equal(3, ripple('some.data').length)
  })

  it('should update a resource', function(done){
    ripple('some.data').on('response', function(){ done() })

    ripple('some.data')[0] = { id: 5, val: 5 }
    assert.deepEqual({ id: 5, val: 5 }, ripple('some.data')[0])
    assert.equal(2, ripple('some.data')[1])
    assert.equal(3, ripple('some.data')[2])
  })

  it('should add to a resource', function(done){
    ripple('some.data').on('response', function(){ done() })

    ripple('some.data').push({ id: 7, value: 7 })
    assert.equal(4, ripple('some.data').length)
  })

  it('should delete from a resource', function(done){
    ripple('some.data').on('response', function(){ done() })

    ripple('some.data').pop()
    assert.equal(2, ripple('some.data').length)
  })

})