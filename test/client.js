var assert  = require('assert')
  , express = require('express')
  , http    = require('http')
  , sinon   = require('sinon')
  , serve   = require('serve-static')
  , app     = express()
  , server  = http.createServer(app)
  , io      = require('socket.io')()
  , opts    = { noClient: true } 
  , ripple  = require('../')(server, opts) 

io.on('connection', function(socket) {
  socket.on('reset', function(i){
    console.log('RESET', i)
    ripple('some'           , [])
    ripple('object'       , { a:0 , b:1, c:2 })
    ripple('array'        , [{i:0}, {i:1},{i:2}])
    ripple({ name: 'proxy', body: [{i:0}, {i:1},{i:2}], headers: { to: to, from: from }})
    ripple('component-1'  , component)
    ripple('component-2'  , component)
      // .db('mysql://user:pass@remote:port/dbname')
  })
})

server.listen(5000)
io.listen(8080)

app.use(serve(__dirname + '/../node_modules/'))
app.use(serve(__dirname + '/client'))

function component(data) {  }

function from(val, body, key) {
  if (key != 'length') return;
  for (var i = 0; i < +val; i++) body[i] = { i: i }
}

function to(d) {
  return { sum: d.reduce(sum, 0), length: d.length }
}

function sum(p, v){ 
  return p + v.i
}