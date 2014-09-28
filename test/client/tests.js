assert = chai.assert
pipe = io('http://localhost:4000')

describe('Ripple Client', function(){
  
  beforeEach(function() {
    console.log('BEFORE', JSON.stringify(ripple('array.data')))
  })

  afterEach(function(done){
    pipe.emit('reset')
    // pipe._callbacks.reset && (pipe._callbacks.reset.length = 0)
    // pipe.on('reset', function(){ console.log('RESET ****', JSON.stringify(ripple('array.data'))); done() })
    io().emit('redraw')
    io()._callbacks.draw && (io()._callbacks.draw.length = 0)
    io().on('draw', function(){ console.log('RESET ****', JSON.stringify(ripple('array.data'))); done() })
  })

  it('should update data (array)', function(done){ 
    ripple('array.data').on('response', function(){ 
      assert.equal(0, ripple('array.data')[0].i)
      assert.equal(1, ripple('array.data')[1].i)
      assert.equal(5, ripple('array.data')[2].i)
      done() 
      console.log('D1')
    })
    ripple('array.data')[2] = { i: 5 }
  })

  it('should push data (array)', function(done){ 
    console.log('T', JSON.stringify(ripple('array.data')))
    // ripple('array.data').on('response', function(){ 
    //   assert.equal(0, ripple('array.data')[0].i)
    //   assert.equal(1, ripple('array.data')[1].i)
    //   assert.equal(2, ripple('array.data')[2].i)
    //   assert.equal(3, ripple('array.data')[3].i)
    //   done() 
    //   console.log('D2')
    // })
    // ripple('array.data').push({ i: 3 })
  })

  it('should remove data (array)', function(done){ 
    // ripple('array.data').on('response', function(){ 
    //   assert.equal(0, ripple('array.data')[0].i)
    //   assert.equal(1, ripple('array.data')[1].i)
    //   assert.equal(undefined, ripple('array.data')[2])
    //   done() 
    //   console.log('D3')
    // })
    // console.log('before', JSON.stringify(ripple('array.data')))
    // ripple('array.data').pop()
    // console.log('after', JSON.stringify(ripple('array.data')))
  })

  // it('should update data (object)', function(done){ 
  //   ripple('object.data').on('response', function(){ 
  //     assert.equal(0, ripple('object.data').a)
  //     assert.equal(1, ripple('object.data').b)
  //     assert.equal(5, ripple('object.data').c)
  //     done() 
  //     console.log('D4')
  //   })
  //   ripple('object.data').c = 5
  // })

  // it('should push data (object)', function(done){ 
  //   ripple('object.data').on('response', function(){ 
  //     assert.equal(0, ripple('object.data').a)
  //     assert.equal(1, ripple('object.data').b)
  //     assert.equal(2, ripple('object.data').c)
  //     assert.equal(3, ripple('object.data').d)
  //     done() 
  //   })
  //   ripple('object.data').d = 3
  // })

  // it('should proxy all data', function(done){ 
  //   assert.equal(3, ripple('proxy.data').sum)
    
  //   ripple('proxy.data').sum++
  //   assert.equal(4, ripple('proxy.data').sum)
  //   assert.equal(3, ripple('proxy.data').length)

  //   ripple('proxy.data')
  //     .on('response', function(){
  //       assert.equal(6, ripple('proxy.data').sum)
  //       assert.equal(4, ripple('proxy.data').length)
  //       done()
  //     })

  //   ripple('proxy.data').length++
  // })

})