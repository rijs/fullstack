var expect = require('chai').expect
  , ripple = require('../')

describe('api', function() {
  
  it('should create initialise ripple and modules', function(){  
    expect(ripple).to.be.a('function')
    expect(ripple.on).to.be.a('function')
    expect(ripple.draw).to.not.be.a('function')
    expect(ripple.invoke).to.not.be.a('function')
    expect('application/javascript' in ripple.types).to.be.ok
    expect('application/data' in ripple.types).to.be.ok
    expect('text/plain' in ripple.types).to.be.ok
    expect('text/html' in ripple.types).to.be.ok
    expect('text/css' in ripple.types).to.be.ok
    expect(global.ripple).to.equal(ripple)
  })

})