assert = chai.assert

describe('Ripple Client', function(){
  
  it('should run client tests', function(){ 
    assert.equal(3, ripple('some.data').length)
  })

})

ripple.on('ready', function(){
  document.body.innerHTML = '<div id="mocha"></div>'
  mocha.run()
})