var assert = chai.assert
  , pipe = io('localhost:8080')
  , i = 0
  , container = document.createElement('div')
  , eq = assert.deepEqual
  
utils('raw', 'all')

function pings(target, fn) {
  var count = 0
  return function handler(){
    if (++count != target) return;
    io().off('response', handler)
    fn.apply()
  }
}

describe('Ripple Client', function(){
  before(function(done){
    document.body.appendChild(container)
    io().on('connect', done)
  })
  
  beforeEach(function(done) {
    var count = 0
    pipe.emit('reset', ++i)
    io().on('response', pings(6, function(){
      console.log('# TEST', i)
      container.innerHTML  = '<component-1></component-1>'
                           + '<component-2 data="array"></component-2>'
      sinon.spy(ripple._resources()['component-1'], 'body')
      sinon.spy(ripple._resources()['component-2'], 'body')
      done()
    }))
  })

  afterEach(function() {
    ripple('component-1').restore()
    ripple('component-2').restore()
    console.log('-------------------')
  })

  describe('Core API', function(){
    describe('Get/Set Resources', function(){
      it('should return the resource body if it exists', function(){ 
        eq({ a: 0, b: 1, c: 2 }, ripple('object'))
      })

      it('should create & return resource if it doesn\'t exist', function(){ 
        eq([], ripple('dynamic'))
        eq({
            'content-type'    : 'application/data'
          , 'content-location': 'dynamic'
          , 'max-versions'    : Infinity
          }
        , ripple._resources()['dynamic'].headers
        )
      })
      it('should create & return resource, with specified name, body and headers', function(){ 
        var definition = { name: 'comprehensive', body: ['apples'], headers: { 'max-versions': 0 } }
        eq(['apples'], ripple(definition))
        eq({ 
            'content-type': 'application/data'
          , 'content-location': 'comprehensive'
          , 'max-versions': 0 
          }
        , ripple._resources()['comprehensive'].headers
        )
      })
      
      it('should create & return resource, with specified name and body', function(){ 
        // new resource
        eq(['oranges'], ripple('simple', ['oranges']))
        // existing resource
        eq([1,2,3], ripple('array', [1,2,3]))
      })
    
    })

    describe('Render Web Components', function(){
      it('should force render a specific component (via arguments)', function(){ 
        ripple.draw(document.querySelector('component-1'))
        ripple.draw(document.querySelector('component-2'))

        assert(ripple('component-1').calledOnce)
        assert(ripple('component-2').withArgs(ripple('array')).calledOnce)
      })
    
      it('should force render a specific component (via context)', function(){ 
        all('component-1').map(ripple.draw)
        all('component-2').map(ripple.draw)

        assert(ripple('component-1').calledOnce)
        assert(ripple('component-2').withArgs(ripple('array')).calledOnce)
      })
    
      it('should force render a specific component (D3 Selection)', function(){ 
        d3.select('component-1').call(ripple.draw)
        d3.select('component-2').call(ripple.draw)

        assert(ripple('component-1').calledOnce)
        assert(ripple('component-2').withArgs(ripple('array')).calledOnce)
      })

      it('should force render a specific component (MutationObserver)', function(done){ 
        // normally just: muto = new MutationObserver(ripple.draw)
        muto = new MutationObserver(function(){ 
          ripple.draw.apply(this, arguments)
          assert(ripple('component-1').calledOnce)
          assert(ripple('component-2').notCalled)
          done()
        })
        conf = { characterData: true, subtree: true, childList: true }

        muto.observe(raw('component-1'), conf)
        raw('component-1').textContent = 'jigga what?'
      })

      it('should force render everything', function(){ 
        ripple.draw()
        assert(ripple('component-1').calledOnce)
        assert(ripple('component-2').withArgs(ripple('array')).calledOnce)
      })

      it('should have render components on data change', function(done){ 
        ripple('array').once('response', function(){
          assert(ripple('component-2').calledOnce)
          done()
        })

        ripple('array').push('test')
      })

      it('should have two-level observation', function(done){ 
        ripple('array').once('response', function(){
          assert(ripple('component-2').calledOnce)
          done()
        })

        ripple('array')[0].i = 'test'
      })
    })

    describe('Time Travel', function(){
      it('should rollback specific resource', function(done){ 
        setTimeout(function(){ 
          ripple('tweets', []) 
        })
        setTimeout(function(){ 
          eq(0, ripple.version('tweets'))
          ripple('tweets').push('lorem') 
        }, 50)
        setTimeout(function(){ 
          eq(1, ripple.version('tweets'))
          ripple('tweets').push('ipsum') 
        }, 100)
        setTimeout(function(){ // switch to []
          eq(2 , ripple.version('tweets'))
          eq([], ripple.version('tweets', 0)) 
          eq(0 , ripple.version('tweets'))
        }, 150) 
        setTimeout(function(){ // switch to ['lorem']
          eq(['lorem'], ripple.version('tweets', 1)) 
          eq(1, ripple.version('tweets'))
        }, 200) 
        setTimeout(function(){ // switch to ['lorem','ipsum']
          eq(['lorem', 'ipsum'], ripple.version('tweets', 2)) 
          eq(2, ripple.version('tweets'))
        }, 250) 
        setTimeout(done, 300) 
      })
    
      it('should rollback entire application state', function(done){ 
        var initial = ripple.version()
        setTimeout(function(){
          ripple('a', [])
          ripple('b', [])
        }, 1)
        setTimeout(function(){ 
          ripple('a').push(1) 
        }, 50)
        setTimeout(function(){ 
          ripple('b').push(2) 
        }, 100)
        setTimeout(function(){ // a: [ ]
          ripple.version(initial+1) 
          eq([ ], ripple('a')) 
        }, 150) 
        setTimeout(function(){ // a: [ ], b :[ ]
          ripple.version(initial+2) 
          eq([ ], ripple('a')) 
          eq([ ], ripple('b')) 
        }, 200) 
        setTimeout(function(){ // a: [1], b :[ ]
          ripple.version(initial+3) 
          eq([1], ripple('a')) 
          eq([ ], ripple('b')) 
        }, 250) 
        setTimeout(function(){ // a: [1], b :[2]
          ripple.version(initial+4) 
          eq([1], ripple('a')) 
          eq([2], ripple('b')) 
        }, 300) 
        setTimeout(done, 300) 
      })
    
      it('should disable versioning', function(done){ 
        ripple({ 
          name: 'versionless'
        , body: []
        , headers: { 'max-versions': 0 }
        })

        setTimeout(function(){
          ripple('versionless').push('a')
        }, 1)
        setTimeout(function(){
          ripple.version('versionless', 0)
          eq(['a'], ripple('versionless'))
          ripple.version('versionless', 1)
          eq(['a'], ripple('versionless'))
        }, 50)
        setTimeout(done, 100)

      })
    

    })
  })

  describe('Server-Client Data Synchronisation', function(){
    it('should update data (array)', function(done){ 
      ripple('array').once('response', function(){ 
        assert.equal(0, ripple('array')[0].i)
        assert.equal(1, ripple('array')[1].i)
        assert.equal(5, ripple('array')[2].i)
        done() 
      })
      ripple('array')[2] = { i: 5 }
    })

    it('should push data (array)', function(done){ 
      ripple('array').once('response', function(){ 
        assert.equal(0, ripple('array')[0].i)
        assert.equal(1, ripple('array')[1].i)
        assert.equal(2, ripple('array')[2].i)
        assert.equal(3, ripple('array')[3].i)
        done() 
      })
      ripple('array').push({ i: 3 })
    })

    it('should remove data (array)', function(done){ 
      ripple('array').once('response', function(){ 
        assert.equal(0, ripple('array')[0].i)
        assert.equal(1, ripple('array')[1].i)
        assert.equal(undefined, ripple('array')[2])
        done() 
      })
      ripple('array').pop()
    })

    it('should update data (object)', function(done){ 
      ripple('object').once('response', function(){ 
        assert.equal(0, ripple('object').a)
        assert.equal(1, ripple('object').b)
        assert.equal(5, ripple('object').c)
        done() 
      })
      ripple('object').c = 5
    })

    it('should push data (object)', function(done){ 
      ripple('object').once('response', function(){ 
        assert.equal(0, ripple('object').a)
        assert.equal(1, ripple('object').b)
        assert.equal(2, ripple('object').c)
        assert.equal(3, ripple('object').d)
        done() 
      })
      ripple('object').d = 3
    })

    it('should remove data (object)', function(done){ 
      ripple('object').once('response', function(){ 
        assert.equal(0, ripple('object').a)
        assert.equal(1, ripple('object').b)
        assert.equal(undefined, ripple('object').c)
        done() 
      })
      delete ripple('object').c
    })

    it('should proxy all data', function(done){ 
      assert.equal(3, ripple('proxy').sum)
      
      ripple('proxy')
        .once('response', function(){
          assert.equal(6, ripple('proxy').sum)
          assert.equal(4, ripple('proxy').length)
          done()
        })

      ripple('proxy').sum++    
      assert.equal(4, ripple('proxy').sum)
      assert.equal(3, ripple('proxy').length)

      ripple('proxy').length++
      assert.equal(4, ripple('proxy').sum)
      assert.equal(4, ripple('proxy').length)
    })
  })

})
      