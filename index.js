const components = require('rijs.components')
    , singleton = require('rijs.singleton')
    , sessions = require('rijs.sessions')
    , features = require('rijs.features')
    , offline = require('rijs.offline')
    , precss = require('rijs.precss')
    , resdir = require('rijs.resdir')
    , serve = require('rijs.serve')
    , pages = require('rijs.pages')
    , needs = require('rijs.needs')
    , sync = require('rijs.sync')
    , core = require('rijs.core')
    , data = require('rijs.data')
    , css = require('rijs.css')
    , fn = require('rijs.fn')
    , client = require('utilise/client')

client && !window.ripple && create()

module.exports = create

function create(opts){
  const ripple = core()    // empty base collection of resources
 
  // enrich..
  singleton(ripple)      // exposes a single instance
  data(ripple)           // register data types
  css(ripple)            // register css types
  fn(ripple)             // register fn types
  components(ripple)     // invoke web components, fn.call(<el>, data)
  needs(ripple)          // define default attrs for components
  precss(ripple)         // preapplies scoped css 
  offline(ripple)        // loads/saves from/to localstorage
  sync(ripple, opts)     // syncs resources between server/client  
  sessions(ripple, opts) // populates sessionid on each connection
  serve(ripple, opts)    // serve client libraries
  pages(ripple, opts)    // serve pages directory 
  features(ripple)       // extend components with features
  resdir(ripple, opts)   // loads from resources folder
  
  return ripple
}