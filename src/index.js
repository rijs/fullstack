import components from 'rijs.components'
import singleton from 'rijs.singleton'
import sessions from 'rijs.sessions'
import reactive from 'rijs.reactive'
import prehtml from 'rijs.prehtml'
import offline from 'rijs.offline'
import precss from 'rijs.precss'
import shadow from 'rijs.shadow'
import resdir from 'rijs.resdir'
import mysql from 'rijs.mysql'
import serve from 'rijs.serve'
import delay from 'rijs.delay'
import sync from 'rijs.sync'
import core from 'rijs.core'
import data from 'rijs.data'
import html from 'rijs.html'
import css from 'rijs.css'
import fn from 'rijs.fn'
import db from 'rijs.db'
import client from 'utilise/client'

client && !window.ripple && create()

export default function create(opts){
  var ripple = core()    // empty base collection of resources
 
  // enrich..
  singleton(ripple)      // exposes a single instance
  data(ripple)           // register data types
  html(ripple)           // register html types
  css(ripple)            // register css types
  fn(ripple)             // register fn types
  db(ripple)             // enable external connections
  components(ripple)     // invoke web components, fn.call(<el>, data)
  reactive(ripple)       // react to changes in resources
  precss(ripple)         // preapplies scoped css 
  prehtml(ripple)        // preapplies html templates
  shadow(ripple)         // encapsulates with shadow dom or closes gap
  delay(ripple)          // async rendering delay 
  mysql(ripple)          // adds mysql adaptor crud hooks
  serve(opts)            // serve client libraries
  sync(ripple, opts)     // syncs resources between server/client
  sessions(ripple, opts) // populates sessionid on each connection
  resdir(ripple)         // loads from resources folder
  offline(ripple)        // loads/saves from/to localstorage

  return ripple
}
