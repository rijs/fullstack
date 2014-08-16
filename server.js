var resources = {}
  , options = {}
  , permissions = {}
  , userSession
  , fs = require('fs')
  , io
  , log = console.log.bind(console, '[ripple]')

module.exports = createRipple

function createRipple(server, app) {
  app.use(append)
  app.use('/ripple', client)

  io = require('socket.io')(server)
  io.on('connection', connected)

  return ripple
}

function ripple(name){
  if (!resources[name]) return console.error('[ripple] No such "'+name+'" resource exists')
  return resources[name].body.filter(checkPerms(name, 'read'))
}

ripple.db = function(config){
  global.con = require('mysql').createPool(config)
  // con.query('show tables', function(err, rows, fields) {
  //   rows.map(value)
  // })
  return ripple
}

ripple.resource = function(name, body, headers, options,  permissions){
  isData(headers, name) && store.apply(this, arguments)
  isHTML(headers, name) && html.apply(this, arguments)
  isJS  (headers, name) && js.apply(this, arguments)

  permissions[name] = permissions
  options[name] = options

  return ripple
}

ripple.userSession = function(userFrom){
  return function(req, res, next){
    userSession = userFrom(req)
    next()
  }
}

function checkPerms(name, type){
  return function(ele){
    var perms = permissions[name]
    return (type in perms)? perms[type].call(this, userSession, ele): true
  }
}

function notPrivate(name){
  return ('private' in options[name])? !options[name].private : true
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
  if (body.push == Array.prototype.push) {
    body.push = function(data){
      var d = q.defer()
        , t = table(name)
        , s = sqlc(t, data)

      log('adding ' + name)

      if (checkPerms(name, 'create')(data)){
        log('insuffcient permissions for ' + name)
        return
      }

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

  body.remove = function(data){
    var d = q.defer()
      , t = table(name)
      , s = sqld(t, data)

      log('removing ' + name)

      if (checkPerms(name, 'delete')(data)){
        log('insuffcient permissions for ' + name)
        return
      }

      con.query(s, function(err, rows, fields){
        if (err) { return d.reject(log('removing ' + name + ' failed', err)) }
        log('removed' + name)
        body.splice(body.indexOf(data), 1)
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
  var alias = isString(body) && body
    , facade = isFunction(body) && body || identity
    , headers = headers || { 
        'content-type': 'application/data'
      , 'content-location': alias || name.split('.')[0] 
      }
    , table = headers['content-location']

  log('getting ', table)
  con.query('select * from ' + headers['content-location'], function(e, rows) {
    if (e) return log('ERROR', table, e)
    log('got ', table, rows.length)
    resources[name] = { 
      name: name
    , body: Array.observe(enhance(rows, name), meta(name))
    , headers: headers
    }
  })

  return ripple
}

function connected(socket){
  Object 
    .keys(resources)
    .filter(notPrivate)
    .forEach(function(name){
      log('sending', name)
      socket.emit('response', resources[name])
    })

  socket.emit('draw')
  socket.on('request', request)
  socket.on('push', push)
  
  function request(req){
    log('request', req)
    return !resources[req.name] 
      ? log('no resource for', req)
      : socket.emit('response', resources[req.name])
      , socket.emit('draw')
  }

  function push(req) {
    log('push', req)

    var name = req[0]
      , added = req[1]

    resources[name].body.push(added)
  }
}

function meta(name) {
  return function (changes) {
    log('observed changes in', name)

    var t = table(name)
      , data = changes[0].object
      , s = sqlu(t, data)


    //check perms and persist changes
    if (checkPerms(name, 'update')(data)){
      log('insuffcient permissions for ' + name)
      return
    }

    con.query(s, function(err, rows, fields) {
      if (err) { return d.reject(log('removing ' + name + ' failed', err)) }
      log('updated' + name)
      resources[name].body = data

      io.emit('response', resources[name])
      io.emit('draw')

      })
    }
}

function append(req, res, next){

  var end = res.end
  res.end = function() {
    if (acceptsHTML(this.req)) {
      res.write('<script src="/socket.io/socket.io.js"></script>')
      res.write('<script src="/ripple" defer></script>')      
    }
    
    end.apply(this, arguments)
  }

  next()
}

function acceptsHTML(req){
  return !!~req.headers.accept.indexOf('html')
}

function isData(headers, name){
  return headers && headers['content-type'] == 'application/data'
    || name.contains('.data')
}

function isJS(headers, name){
  return headers && headers['content-type'] == 'application/javascript'
    || name.contains('.js')
}

function isHTML(headers, name){
  return headers && headers['content-type'] == 'text/html'
    || name.contains('.html')
}

function client(req, res){
  res.sendfile(__dirname + '/client.js')
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
