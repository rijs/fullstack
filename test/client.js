var assert  = require('assert')
  , express = require('express')
  , http    = require('http')
  , sinon   = require('sinon')
  , mysql   = require('mysql')
  , io      = require('socket.io')()
  , app     = express()
  , server  = http.createServer(app)
  , ripple  = require('../server')(server, app, 1)

  
var query = sinon.stub().callsArgWith(1, 0, [1,2,3])
  , escape = function(d){ return d }

mysql.createPool = sinon.stub().returns({ 
  query: query
, escape: escape
})

io.on('connection', function(socket) {
  socket.on('reset', function(){
    console.log('RESET')
    ripple._drop()
    ripple
      .db()
      .resource('some.data')
      .resource('object.data', { a:0 , b:1, c:2 })
      .resource('array.data' , [{i:0}, {i:1},{i:2}])
      .resource('proxy.data' , [{i:0}, {i:1},{i:2}], { to: to, from: from })
      
    socket.emit('reset')
  })
})

io.listen(4000);
server.listen(3000)
app.use(express.static(__dirname+'/client'))

function from(key, val, body) {
  if (key != 'length') return;
  for (var i = 0; i < +val; i++) body[i] = { i: i }
}

function to(d) {
  return { sum: d.reduce(sum, 0), length: d.length }
}

function sum(p, v){ 
  return p + v.i
}