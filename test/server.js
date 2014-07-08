var assert  = require('assert')
  , express = require('express')
  , http    = require('http')
  , sinon   = require('sinon')
  , rip     = require('../server')
  , mysql   = require('mysql')
  , app
  , server
  , ripple

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
  })

})