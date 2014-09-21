var resources = {}
  , _permissions = {}
  , _userSession
  , fs = require('fs')
  , q = require('q')
  , io
  , log = console.log.bind(console, '[ripple]')
  , onHeaders = require('on-headers')
  , apn = require('apn')
  , con

// ----------------------------------------------------------------------------
// APNS
// ----------------------------------------------------------------------------
var options = { }
var apnConnection = new apn.Connection(options)

module.exports = createRipple

function createRipple(server, app, appendClient) {
  log('creating')
  if (appendClient) {
    app.use('/ripple', client)
    app.use(append)
  }

  io = require('socket.io')(server)
  io.on('connection', connected)

  return ripple
}

function ripple(name){
  if (!resources[name]) return console.error('[ripple] No such "'+name+'" resource exists')
  return resources[name].body.filter(checkPerms(name, 'read'))
}

ripple._resources = function(){
  return resources
}

ripple.db = function(config){
  con = require('mysql').createPool(config)
  // con.query('show tables', function(err, rows, fields) {
  //   rows.map(value)
  // })
  return ripple
5,2,3}

ripple.resource = function(name, body, headers, permissions){
  isData(headers, name) && store.apply(this, arguments)
  isHTML(headers, name) && html.apply(this, arguments)
  isJS  (headers, name) && js.apply(this, arguments)

  permissions && (_permissions[name] = permissions)
  return ripple
}

ripple.userSession = function(userFrom){
  return function(req, res, next){
    _userSession = userFrom(req)
    next()
  }
}

function checkPerms(name, type){
  log('Checking Permissions for ' + type + ' on '+ name)
  return function(ele){
    var perms = _permissions[name]
    return (perms && type in perms)
      ? perms[type].call(this, _userSession, ele): true
  }
}

function table(name) {
  return resources[name]['headers']['content-location']
}

function sqlc(name, body) {
  var template = 'INSERT INTO {table} ({keys}) VALUES ({values});'
  template = template.replace('{table}', name)
  template = template.replace('{keys}', Object.keys(body).filter(noId).join(','))
  template = template.replace('{values}', Object.keys(body).filter(noId).map(value(body)).join(','))
  log(template)
  return template
}

function sqlu(name, body) {
    var template = 'UPDATE {table} SET ({kvpairs}) WHERE id = {id};'
    template = template.replace('{table}', name)
    template = template.replace('{id}', body['id'])
    template = template.replace('{kvpairs}', Object.keys(body).filter(noId)).map(kvpair(body).join(','))
    log(template)
    return template
}

function sqld(name, body) {
    var template = 'DELETE FROM {table} WHERE id = {id};'
    template = template.replace('{table}', name)
    template = template.replace('{id}', body['id'])
    log(template)
    return template
}

function noId(key) {
  return key !== 'id'
}

function value(arr) {
  return function(key){
    return con.escape(arr[key])
  }
}

function kvpair(arr) {
  return function(key){
    return key+'='+con.escape(arr[key])
  }
}

function enhance(body, name) {
  log('enhancing ' +  name)
  if (body.push == Array.prototype.push) {
    body.push = function(data){
      var d = q.defer()
      log('adding ' + name)
      
      
      var t = table(name)
        , s = sql(t, data)

      if (checkPerms(name, 'create')(data)){
        log('insuffcient permissions for ' + name)
        return
      }

      if (!con) return d.resolve(body[body.length] = data, data.id)

      con.query(s, function(err, rows, fields) {
        if (err) { return d.reject(log('adding ' + name + ' failed', err)) }
        log('added ' + name, rows.insertId)
        data.id = rows.insertId
        body[body.length] = data
        d.resolve(rows.insertId)
      })
      
      return d.promise
    }
  }

  body.remove = function(idx){
    var d = q.defer()
      , t = table(name)
      , data = body[idx]
      , s = sqld(t, data)

     if (checkPerms(name, 'delete')(data)){
        log('insuffcient permissions for ' + name)
        return
      }

     log('removing ' + name)
      if (!con) return d.resolve(body.splice(idx, 1))


      con.query(s, function(err, rows, fields){
        if (err) { return d.reject(log('removing ' + name + ' failed', err)) }
        log('removed' + name)
        body.splice(idx, 1)
        d.resolve()
      })

      return d.promise
}

  return body
}

function js(name, fn, headers){
  var headers = headers || { 'content-type': 'application/javascript' }

  resources[name] = { 
    name: name
  , body: '' + Object.observe(fn, meta(name))
  , headers: headers 
  }
  
  return ripple
}

function html(name, html, headers){
  var headers = headers || { 'content-type': 'text/html' }

  resources[name] = { 
    name: name
  , body: Object.observe([html], meta(name))[0]
  , headers: headers 
  }
  
  return ripple
}

function store(name, body, headers) {
  var alias   = isString(body) && body
    , facade  = isFunction(body) && body || identity
    , body    = isObject(body) && body || []
    , headers = headers || { 
        'content-type': 'application/data'
      , 'content-location': alias || name.split('.')[0] 
      , 'private': body.private
      }
    , table = headers['content-location']

  log('getting', table)

  con 
  ? con.query('select * from '+headers['content-location'], function(e, rows) {
      if (e) return log('ERROR', table, e)
      log('got ', table, rows.length)
      register(rows)
    })
  : register(body)

  function register(rows) {
    resources[name] = { 
      name: name
    , body: Array.observe(enhance(rows, name), meta(name))
    , headers: headers
    }
  }

  return ripple
}

function connected(socket){
  Object 
    .keys(resources)
    .filter(notPrivate)
    .map(logSending)
    .map(emit(socket))
    
  socket.emit('draw')
  socket.on('request', request)
  socket.on('push', push)
  socket.on('remove', remove)
  socket.on('update', update)
  

  function request(req){
    log('request', req)
    return !resources[req.name] || resources[req.name].headers.private
      ? log('private or no resource for', req)
      : socket.emit('response', resources[req.name])
      , socket.emit('draw')
  }


  function push(req) {
    log('push', req)

    var name = req[0]
      , added = req[1]

    resources[name].body.push(added)
  }

  function remove(req) {
    log('remove', req)

    var name = req[0]
      , body = resources[name].body
      , removed = body.indexOf(req[1])
    body.remove(removed)
  }

  function update(req) {
    log('update', req)

    var name = req[0]
      , updated = req[1]
    meta(name)([{object: updated}]) //should refactor meta to have an update function
  }
}


function emit(socket) {
  return function (name) {
    socket.emit('response', resources[name])
  }
}

function logSending(name) {
  log('sending', name)
  return name
}

function notPrivate(name) {
  return !resources[name].headers.private
}

function meta(name) {
  return function (changes) {
    log('observed changes in', name)

    var d = q.defer()
      , t = table(name)
      , data = changes[0].object
      , body = resources[name].body
      , s = sqlu(t, data)


    //check perms and persist changes
    if (checkPerms(name, 'update')(data)){
      log('insuffcient permissions for ' + name)
      return d.reject()
    }

    if (!con) return d.resolve(body = data)

    con.query(s, function(err, rows, fields) {
      if (err) { return d.reject(log('removing ' + name + ' failed', err)) }
      log('updated' + name)
      resources[name].body = data

      io.emit('response', resources[name])
      io.emit('draw')
      d.resolve()
      })

      return d.promise
    }
}


function append(req, res, next){
  var end = res.end

  onHeaders(res, function () {
    this.removeHeader('Content-Length')
  })

  res.end = function() {

    if (acceptsHTML(this.req)) {
      res.write('<script src="/socket.io/socket.io.js" defer></script>')
      res.write('<script src="/ripple" defer></script>')      
    }
    
    end.apply(this, arguments)
  }

  next()
}

function acceptsHTML(req){
  return req.headers.accept && !!~req.headers.accept.indexOf('html')
}

function isData(headers, name){
  return headers && (headers['content-type'] == 'application/data') 
    || name.contains('.data')
}

function isJS(headers, name){
  return (typeof headers !== 'undefined') 
    && headers['content-type'] == 'application/javascript'
    || name.contains('.js')
}

function isHTML(headers, name){
  return (typeof headers !== 'undefined') 
    && headers['content-type'] == 'text/html'
    || name.contains('.html')
}

function client(req, res){
  res.sendFile(__dirname + '/client.js')
}

function id(req) {
  return req.name + '.' + compress(req.headers['content-type'])
  // return type 
  //   ? name + '.' + type
  //   : name.headers 
  //   ? name.headers['name'] + '.' + name.headers['content-type']
  //   : name['name'] + '.' + name['content-type']
}

function compress(type) {
  return type == 'application/javascript'
    ? 'js'
    : type == 'application/data' 
    ? 'data'
    : 'html'
}


// function value(d){ 
//   return d[Object.keys(d)[0]]
// }

function log(d){
  log(d)
}

function objectify(rows) {
  var o = {}
  return rows.forEach(function(d){ o[d.id] = d }), o
}

function isString(d) {
  return typeof d == 'string'
}

function isObject(d) {
  return typeof d == 'object'
}

function isFunction(d) {
  return typeof d == 'function'
}

function identity(d){ return d }
