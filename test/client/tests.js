var assert = chai.assert
  , pipe = io('localhost:8080')
  , i = 0
  
describe('Ripple Client', function(){
  
  before(function(done){
    io().once('draw', done)
  })

  beforeEach(function(done) {
    pipe.emit('reset', ++i)
    io().once('draw', function(){ 
      console.log('# TEST', i)
      done()
    })
  })

  afterEach(function() {
    console.log('-------------------')
  })

  it('should update data (array)', function(done){ 
    ripple('array.data').once('response', function(){ 
      assert.equal(0, ripple('array.data')[0].i)
      assert.equal(1, ripple('array.data')[1].i)
      assert.equal(5, ripple('array.data')[2].i)
      done() 
    })
    ripple('array.data')[2] = { i: 5 }
  })

  it('should push data (array)', function(done){ 
    ripple('array.data').once('response', function(){ 
      assert.equal(0, ripple('array.data')[0].i)
      assert.equal(1, ripple('array.data')[1].i)
      assert.equal(2, ripple('array.data')[2].i)
      assert.equal(3, ripple('array.data')[3].i)
      done() 
    })
    ripple('array.data').push({ i: 3 })
  })

  it('should remove data (array)', function(done){ 
    ripple('array.data').once('response', function(){ 
      assert.equal(0, ripple('array.data')[0].i)
      assert.equal(1, ripple('array.data')[1].i)
      assert.equal(undefined, ripple('array.data')[2])
      done() 
    })
    ripple('array.data').pop()
  })

  it('should update data (object)', function(done){ 
    ripple('object.data').once('response', function(){ 
      assert.equal(0, ripple('object.data').a)
      assert.equal(1, ripple('object.data').b)
      assert.equal(5, ripple('object.data').c)
      done() 
    })
    ripple('object.data').c = 5
  })

  it('should push data (object)', function(done){ 
    ripple('object.data').once('response', function(){ 
      assert.equal(0, ripple('object.data').a)
      assert.equal(1, ripple('object.data').b)
      assert.equal(2, ripple('object.data').c)
      assert.equal(3, ripple('object.data').d)
      done() 
    })
    ripple('object.data').d = 3
  })

  it('should remove data (object)', function(done){ 
    ripple('object.data').once('response', function(){ 
      assert.equal(0, ripple('object.data').a)
      assert.equal(1, ripple('object.data').b)
      assert.equal(undefined, ripple('object.data').c)
      done() 
    })
    delete ripple('object.data').c
  })

  it('should proxy all data', function(done){ 
    assert.equal(3, ripple('proxy.data').sum)
    
    ripple('proxy.data')
      .once('response', function(){
        assert.equal(6, ripple('proxy.data').sum)
        assert.equal(4, ripple('proxy.data').length)
        done()
      })

    ripple('proxy.data').sum++    
    assert.equal(4, ripple('proxy.data').sum)
    assert.equal(3, ripple('proxy.data').length)

    ripple('proxy.data').length++
    assert.equal(4, ripple('proxy.data').sum)
    assert.equal(4, ripple('proxy.data').length)
  })

})