var assert  = require('assert')
  , express = require('express')
  , http    = require('http')
  , sinon   = require('sinon')
  , rip     = require('../server')
  , mysql   = require('mysql')
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
    
    var query = sinon.stub().callsArgWith(1, 0, [1,2,3])
      , escape = function(d){ return d }

    mysql.createPool = sinon.stub().returns({ 
      query: query
    , escape: escape
    })
    
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
  })

  it('should CRUD a resource', function(done){
    ripple
      .db()
      .resource('some.data')

    var i = 0

    // subscribe to confirmations
    ripple('some.data')
      .on('response', function(d){ (++i == 3) && done() })

    // update
    ripple('some.data')[0] = { id: 5, val: 5 }
    assert.deepEqual({ id: 5, val: 5 }, ripple('some.data')[0])
    assert.equal(2, ripple('some.data')[1])
    assert.equal(3, ripple('some.data')[2])
    ripple._flush('some.data')

    // create
    ripple('some.data')
      .push({ id: 7, value: 7 })
    assert.equal(4, ripple('some.data').length)
    ripple._flush('some.data')

    // delete
    ripple('some.data')
      .pop()
    assert.equal(3, ripple('some.data').length)
  })

  // it('can restrict CRUD ops with permissions', function(){
  //   ripple
  //     .db()
  //     .resource('some.data', undefined, undefined, {
  //         'create' : function() { return false }
  //       , 'read'   : function() { return false }
  //       , 'update' : function() { return false }
  //       , 'delete' : function() { return false }
  //     })

  //   //check cannot read 
  //   assert.equal(0, ripple('some.data').length)

  //   //check create failure
  //   ripple('some.data').push(7)
  //   assert.equal(3, ripple._resources()['some.data'].length)

  //   //check delete failure
  //   ripple('some.data').pop()
  //   assert.equal(3, ripple._resources()['some.data'].length)
  // })

})