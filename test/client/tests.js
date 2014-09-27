assert = chai.assert

describe('Ripple Client', function(){
  
  it('should run client tests', function(){ 
    assert.equal(3, ripple('some.data').length)
  })

  it('should proxy all data', function(){ 
    assert.equal(6, ripple('protected.data').total)
  })

})