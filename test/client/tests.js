assert = chai.assert
pipe = io('http://localhost:4000')

describe('Ripple Client', function(){
  
  afterEach(function(done){
    pipe.emit('reset')
    pipe._callbacks.reset && (pipe._callbacks.reset.length = 0)
    pipe.on('reset', done)
  })

  it('should run client tests', function(){ 
    assert.equal(3, ripple('some.data').length)
  })

  it('should proxy all data', function(done){ 
    assert.equal(3, ripple('protected.data').sum)
    
    ripple('protected.data').sum++
    assert.equal(4, ripple('protected.data').sum)
    assert.equal(3, ripple('protected.data').length)

    ripple('protected.data')
      .on('response', function(){
        assert.equal(6, ripple('protected.data').sum)
        assert.equal(4, ripple('protected.data').length)
        done()
      })

    ripple('protected.data').length++
  })

})