var expect = require('chai').expect
  , ripple 
  , temp

describe('Ripple', function() {

  before(function(){
    ripple = require('./').default()
  })
  
  beforeEach(function(done){
    ripple.io.emit('beforeEach')
    ripple.io.once('done', debounce(done))
  })

  afterEach(function(){
    temp && ripple.io.off('change', temp)
  })

  it('should create initialise ripple and modules', function(){  
    expect(ripple).to.be.a('function')
    expect(ripple.on).to.be.a('function')
    expect(ripple.draw).to.be.a('function')
    expect(ripple.sync).to.be.a('function')
    expect(ripple.io).to.be.ok
    expect('application/javascript' in ripple.types).to.be.ok
    expect('application/data' in ripple.types).to.be.ok
    expect('text/plain' in ripple.types).to.be.ok
    expect('text/html' in ripple.types).to.be.ok
    expect('text/css' in ripple.types).to.be.ok
  })

  it('should create global and local isolated instances', function(){  
    expect(window.ripple).to.be.a('function')
    expect(window.ripple.resources).to.be.a('object')

    var ripple1 = require('./').default()
    expect(ripple != ripple1).to.be.ok

    var ripple2 = require('./').default()
    expect(ripple1 != ripple2).to.be.ok
  })

  // background: 
  // 'pending' should be set and removed by rAF
  // in this case, it was being set, sent to server and registered
  // with a pending header, which was then never removed by a rAF
  // which then blocked subsequent renders for that resource
  // type-specific proxies enable cleaning headers intended 
  // for local usage before transport
  it('should not send/receive pending header', function(done){
    expect(ripple.resources.array.headers.pending).to.not.be.ok

    // simulate a pending render that will not be cleared
    ripple.resources.array.headers.pending = 10

    // trigger a send to server
    ripple('array').push('sth')

    // there should be no pending header
    setTimeout(function(){
      expect(ripple.resources.array.headers.pending).to.not.be.ok
      done()
    }, 1000)

  })

  // background: 
  // server-side specific headers related to database should
  // not appear on the client
  it('should not send/receive fields/table header', function(){
    expect(ripple.resources.dbres.headers.fields).to.not.be.ok
    expect(ripple.resources.dbres.headers.table).to.not.be.ok
  })

})