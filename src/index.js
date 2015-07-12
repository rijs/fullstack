import components from 'components'
import singleton from 'singleton'
import sessions from 'sessions'
import reactive from 'reactive'
import prehtml from 'prehtml'
import offline from 'offline'
import precss from 'precss'
import shadow from 'shadow'
import resdir from 'resdir'
import mysql from 'mysqlr'
import serve from 'serve'
import delay from 'delay'
import sync from 'sync'
import core from 'core'
import data from 'data'
import html from 'html'
import css from 'css'
import fn from 'fn'
import db from 'db'
import client from 'utilise/client'

module.exports = client ? createRipple() : createRipple
 
function createRipple(opts){
  var ripple = core()  // empty base collection of resources

  // enrich..
  data(ripple)           // register data types
  html(ripple)           // register html types
  css(ripple)            // register css types
  fn(ripple)             // register fn types
  db(ripple)             // register fn types
  components(ripple)     // invoke web components, fn.call(<el>, data)
  singleton(ripple)      // exposes a single instance
  reactive(ripple)       // react to changes in resources
  prehtml(ripple)        // preapplies html templates
  precss(ripple)         // preapplies scoped css 
  shadow(ripple)         // encapsulates with shadow dom or closes gap
  delay(ripple)          // async rendering delay 
  mysql(ripple)          // adds mysql adaptor crud hooks
  serve(opts)            // serve client libraries
  sync(ripple, opts)     // syncs resources between server/client
  sessions(ripple, opts) // populates sessionid on each connection
  resdir(ripple)         // loads from resources folder
  offline(ripple)         // loads from resources folder

  return ripple
}
