import { values, log, min, not, header, key, by, is, identity, str } from './utils'
import path from 'path'

export default function(ripple){
  var resources = ripple._resources()
    , socket = ripple._socket()

  return { emit, connected }

  function emit(s) {
    return function (name) {
      if (!name) return values(resources)
                          .filter(not(header('private')))
                          .map(key('name'))
                          .map(emit(s))
                      , ripple

      var r = resources[name]

      return (!r || r.headers.private)
        ?  log('private or no resource for', name)
        :  typeof s == 'string'
        ?  logr(socket.of('/').sockets.filter(by('sessionID', s)).map(sendTo))
        : (s == socket || !s)
        ?  logr(socket.of('/').sockets.map(sendTo))
        :  logr([sendTo(s)])

      function logr(results){
        log(
          str(results.filter(Boolean).length).green.bold 
        + '/' 
        + str(socket.of('/').sockets.length).green
        , 'sending'
        , name
        )
      }

      function sendTo(s) {
        var msg = to(r, s)
        msg.body && s.emit('response', msg)
        return !!msg.body
      }
    }
  }

  function connected(socket){ 
    log('connected', socket.id)
    var types = {
          push: push
        , remove: remove
        , update: update 
        }

    emit(socket)()

    socket.on('request', request)
    socket.on('change' , change)

    function request(name){
      log('request', name)
      return (!resources[name] || resources[name].headers.private)
        ? log('private or no resource for request', name)
        : emit(socket)(name)
    }

    function change(req) {
      log('client', req.type, req.name, req.key)
      if (!resources[req.name]) return log('no resource', req.name);

      var name  = req.name
        , key   = req.key
        , value = req.value
        , type  = req.type
        , fn    = resources[name].headers['proxy-from']
        , body  = resources[name].body
        , next  = types[req.type]

      if (!fn || fn.call(socket, value, body, key, type, name, next))
        next(key, value, body)
    }

    function push(key, value, body) {
      is.arr(body)
        ? body.splice(key, 0, value) 
        : body[key] = value
    }

    function remove(key, value, body) {
      is.arr(body)
        ? body.splice(key, 1) 
        : delete body[key]
    }

    function update(key, value, body) {
      body[key] = value
    }
  }

  function to(resource, socket){
    var fn = resource.headers['proxy-to'] || identity
      , headers  = { 'content-type': resource.headers['content-type'] }
      , extend   = resource.headers['extends']
      , versions = resource.headers['versions']
      , cache    = resource.headers['cache-control']
      , body     = is.func(resource.body) ? '' + resource.body : resource.body

     extend   && (headers['extends']  = extend)
     cache    && (headers['cache']    = cache)
    !versions && (headers['versions'] = versions)

    return { 
      name: resource.name
    , body: fn.call(socket, body)
    , headers: headers
    }
  }
}

// auto-appends the client + deps
export function append(req, res, next){
  var end = res.end

  require('on-headers')(res, function () {
    this.removeHeader('Content-Length')
  })

  res.end = function() {
         req.accepts("html")
    && !~req.originalUrl.indexOf('.js')
    && !~req.originalUrl.indexOf('.css')
    && res.write(`<script src="/immutable.min.js" defer></script>
                  <script src="/socket.io/socket.io.js" defer></script>
                  <script src="/ripple.js" defer></script>`)
    
    end.apply(this, arguments)
  }

  next()
}

// populates session id on socket
export function auth(config) {
  return function(socket, next){
    var req = {
      "headers": {
        "cookie": socket.request.headers.cookie,
      },
    }

    require('cookie-parser')(config.secret)(req, null, function() {})
    var name = config.key
    socket.sessionID = req.signedCookies[name] || req.cookies[name]
    next()
  }
}

function serveClient(req, res){
  res.sendFile(path.resolve(__dirname, 'client.' + (min ? 'min.js' : 'js')))
}

function serveImmutable(req, res){
  res.sendFile(path.resolve(__dirname, '../node_modules/immutable/dist/immutable.min.js'))
}

export var serve = {
  client: serveClient
, immutable: serveImmutable
}