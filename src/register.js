import { is, err, clone, promise, emitterify, table, interpret, log, parameterise, header, has, immmutable, listeners, call, def, versions, client, first } from './utils'

export default function(ripple){
  var resources = ripple._resources()
    , socket = ripple._socket()
    
  // -------------------------------------------
  // Gets or sets a resource
  // -------------------------------------------
  // ripple('name')     - returns the resource body if it exists
  // ripple('name')     - creates & returns resource if it doesn't exist
  // ripple('name', {}) - creates & returns resource, with specified name and body
  // ripple({ ... })    - creates & returns resource, with specified name, body and headers
  return function (name, body, headers){
    return is.str(name) && !body &&  resources[name] ? resources[name].body
         : is.str(name) && !body && !resources[name] ? register({ name })
         : is.str(name) &&  body                     ? register({ name, body, headers })
         : is.obj(name)                              ? register(name)
         : err('Couldn\'t find or create resource', name)
  }

  function register({name, body, headers = {}} = {}) { 
    var { draw, cache, emit } = ripple
      , res = { name, body, headers }
      , parsed

    interpret(res)   
    log('registering', res.name)
    // is.route(name) && !resources[name] && rhumb.add(res.name, parameterise(res.name))

    !(res.name in resources) && resources.length++
    parsed = is.data(res) ? first(data(res)) : promise(resources[res.name] = res)
    parsed.then(() => {
      client ? draw(res) : emit()(res.name)
      cache()
      // log('registered', res.name)
    })

    return res.body
  }

  function data(res) {
    var { db, version } = ripple
      , table    = header('content-location')(res)
      , max      = header('max-versions')(res)
      , rollback = has(res.headers, 'version')

    client && (max = max && window.Immutable)
    max && (res.versions = res.versions || versions(resources, res.name))
    client && !rollback && max && res.versions.push(immmutable(res.body))
    resources[res.name] = watch(res)

    return [db().all(table, res.body).then(commit), res]

    function commit(rows) {
      res.body = rows
      resources[res.name] = watch(res)
      listeners(resources, res.name).map(call())
      client && !rollback && max && version.history()
    }
  }

  // observe a resource for changes
  function watch(res) {
    var opts = { type: 'response', listeners: listeners(resources, res.name) }
    
    !res.body.observer 
     && Array.observe(
          res.body = emitterify(res.body, opts)
        , def(res.body, 'observer', meta(res.name))
        )

    is.arr(res.body)
      && res.body.forEach(observe)

    return res

    function observe(d) {
      if (!is.obj(d)) return;
      if (d.observer) return;
      var fn = ometa(res.name)
      def(d, 'observer', fn)
      Object.observe(d, fn)
    }
  }

  // short-circuit shortcut for two-level observation
  function ometa(name) {
    return function(changes) {
      changes.forEach(function(change){
        if (!change.type == 'update') return;
        var i = resources[name].body.indexOf(change.object)
        resources[name].body[i] = clone(change.object)
      })
    }
  }

  // top-level observer
  function meta(name) {
    return function (changes) {
      var { draw } = ripple
      log('observed changes in', name, changes.length)
      watch(resources[name])
      changes.forEach(normalize(name))
      draw(name)
    }
  }

  // normalize a change
  function normalize(name) {
    return function(change) {
      // console.log('change', change)
      var { version } = ripple
        , type    = change.type
        , removed = type == 'delete' ? change.oldValue : change.removed && change.removed[0]
        , data    = change.object
        , key     = change.name || change.index
        , value   = data[key]
        , max     = header('max-versions')(resources[name]) 
        , skip    = type == 'update' && (str(value) == str(change.oldValue))
        , details = {
            name  : name
          , key   : key
          , value : removed || value 
          , type  : type == 'update'             ? 'update'
                  : type == 'delete'             ? 'remove'
                  : type == 'splice' &&  removed ? 'remove'
                  : type == 'splice' && !removed ? 'push'  
                  : type == 'add'                ? 'push'  
                  : false
          }

      if (client) {
       max = max && window.Immutable
       max && version.record(details)
       socket.emit('change', details)
      }

      if (!client) {
        if (skip) return log('skipping update')
        crud(!is.arr(data) ? { name } : details)
      }

    }
  }

  function crud({ name, value, type }) {
    var { emit, db } = ripple
    log('crud', name, type = type || 'noop')

    var t = table(resources[name])
      , f = type && db()[type]
      , r = listeners(resources, name)

    f(t, value).then(function(id){
      emit()(name)
      r.map(call(id))    

      values(resources)
        .filter(header('content-location', t))
        .filter(not(by('name', name)))
        .map(data)
        .map(async(key('name')))
        .map(then(emit()))
    })

  }

}