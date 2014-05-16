var resources = {}
  , store = {}
  , socket = io()

// activate()

ripple = function(name){
  return resources[name]
}

function activateAll(){
  all('[data-resource]')
    .map(bind)
    .map(invoke)
    .map(log)
}

function activate(name) {
  if (!isJS(name)) return;
  all('[data-resource='+name+']')
    .map(bind)
    .map(invoke)
}

ripple._resources = function(){
  return resources
}

ripple._store = function(){
  return store
}

function invoke(d){ 
  d.__render__ && d.__render__()
  return d
}

function bind(d){
  var name = d.dataset.resource
  ;(!resources[name] && !store[name])
    ? fetch(name)
    : (
        d.__render__ = resources[name]
      , d.__data__ = store[name]
      )

  return d
}

function fetch(name){
  socket.emit('request', { name: name })
}

socket.on('response', function(res) {
  console.log('res', res.name, res.store)
  res.resource && (resources[res.name] = interpret(res.resource))
  res.store    && (store[res.name]     = res.store)
  // activate(res.name)
})

socket.on('draw', activateAll)

function type(name) {
  return resources[name][0] == '<'
    ? 'text/html'
    : 'application/javascript'
}

function isJS(name) {
  return type(name) == 'application/javascript'
}
function interpret(resource) {
  return resource[0] == '<'
    ? html(resource)
    : fn(resource)
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
function all(selector){
  return array(document.querySelectorAll(selector))
}

function array(d){
  return Array.prototype.slice.call(d, 0)
}

function fn(resource){
  return (new Function("return " + resource))()
}

function html(resource){
  return resource
}

function log(d){
  console.log(d)
}

// ----------------------------------------------------------------------------
// RIPPLE
// ----------------------------------------------------------------------------
// !(function(){

//   function createRipple() {
//     var socket = io()
//       , cache = {}
//       , audience = []

//     socket.emit('connected', Date())

//     function ripple(render) {
//       return function(){
//         audience
//           .filter(byNode(this.node()))
//           .map(setRender(render))
//       }
//     }

//     ripple.request = function(resource){
//       if (!resource) return
//       if (cache[resource]) return cache[resource]
//       return fetch(resource)
//     }
    
//     ripple.cache = function(value){
//       if (!value) return cache

//     }

//     socket.on('response', function(res) {
//       console.log('resource received', res.resource, cache, res)
//       res.resource.map(to(cache[res.name]))
//     })

//     return ripple

//     function fetch(resource){
//       socket.emit('request', { 
//         name: resource
//       })

//       return function(){
//         audience.push({
//           node: this
//         , name: resource
//         })
//         return Array.observe(cache[resource] = [], eagle(resource)) 
//       }
//     }

//     function eagle(name){

//       return function(){
//         console.log('SOMETHING CHANGED!!!', name, audience)
//         audience
//           .filter(byName(name))
//           .map(invoke)
//       }
//     }
    
//     function invoke(d){
//       d3.select(d.node).call(d.render)
//     }

//     function to(target){
//       return function(d){
//         target.push(d)
//       }
//     }

//     function byName(name){
//       return function(d){
//         return d.name == name
//       }
//     }

//     function byNode(node){
//       return function(d){
//         console.log(d.node, node)
//         return d.node == node
//       }
//     }

//     function setRender(render){
//       return function(d){
//         return d.render = render, d
//       }
//     }

//   }

//   window.ripple = createRipple()
// })()