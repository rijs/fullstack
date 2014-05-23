var resources = {}
  , store = {}
  , fs = require('fs')
  , io

module.exports = ripple

function ripple(server, app){
  app.use(append)
  app.use('/ripple', client)

  io = require('socket.io')(server)
  io.on('connection', connected)

  return ripple
}

ripple.db = function(config){
  global.con = require('mysql').createPool(config)

  // con.query('show tables', function(err, rows, fields) {
  //   rows.map(value)
  // })

  return ripple
}

ripple.resource = function(name, fn){
  if (!fn) return resources[name]
  resources[name] = fn
  return ripple
}

ripple.store = function(name, table){
  if (!name) return store
  con.query('select * from ' + (table || name), function(err, rows) {
    Array.observe(store[name] = rows, meta(name))
  })
  return ripple
}

function connected(socket){
  Object 
    .keys(resources)
    .forEach(function(name){
      socket.emit('response', { 
        name: name
      , resource: '' + resources[name]
      })
    })

  Object 
    .keys(store)
    .forEach(function(name){
      socket.emit('response', { 
        name: name
      , store: store[name]
      })
    })

  socket.emit('draw')
  socket.on('request', request)
  
  function request(req){
    socket.emit('response', {
      store: store[req.name]
    , resource: '' + resources[req.name]
    , name: req.name
    })
  }
}

function meta(name) {
  return function (changes) {
    io.emit('response', {
      store: changes[0].object
    , name: name
    })
    io.emit('draw')
  }
}

function append(req, res, next){

  var end = res.end
  res.end = function() {
    if (isHTML(this.req)) {
      res.write('<script src="/socket.io/socket.io.js"></script>')
      res.write('<script src="/ripple" defer></script>')      
    }
    
    end.apply(this, arguments)
  }

  next()
}

function isHTML(req){
  return !!~req.headers.accept.indexOf('html')
}

function client(req, res){
  res.sendfile(__dirname + '/client.js')
}

function value(d){ 
  return d[Object.keys(d)[0]]
}

function log(d){
  console.log(d)
}

function objectify(rows) {
  var o = {}
  return rows.forEach(function(d){ o[d.id] = d }), o
}

var c = 0
setInterval(function(){ store['events'].push({ id:c++, title: c, host_id: 1, date: +(new Date())}) }, 3000)