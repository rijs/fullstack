import { is, chain, def, log, noop, client, use, sio, attr } from './utils'
import { auth, append, serve } from './sync'
import register from './register'
import version from './version'
import cache from './cache'
import draw from './draw'
import rhumb from 'rhumb'
import sync from './sync'
import db from './db'

export default function createRipple(server, app = { use: noop }, opts = { client: true }) {
  log('creating')

  var resources = { }
    , socket = sio(server)
    , routes = rhumb.create()

  ;[ 
    [ 'versions', [] ] 
  , [ 'length', 0 ] 
  , [ 'time', 0 ] 
  ].map(([ key, val ]) => def(resources, key, val, true))

  ripple._resources = () => resources
  ripple._socket    = () => socket
  ripple._routes    = () => routes
  ripple._register  = register(ripple)
  ripple.resource   = chain(ripple._register, ripple)
  ripple.cache      = cache(ripple)
  ripple.db         = db(ripple)
  ripple.draw       = draw(ripple)
  ripple.version    = version(ripple)
  ripple.use        = use(ripple)
  ripple.emit       = !client && sync(ripple).emit
  
  setTimeout(ripple.cache.load, 0)

  client ? socket.on('response', ripple._register)
         : (socket.on('connection', sync(ripple).connected)  
         , app.use('/ripple.js', serve.client)
         , app.use('/immutable.min.js', serve.immutable)
         , opts.client && app.use(append)
         , opts.session && socket.use(auth(opts.session))
         )

  return ripple
  
  function ripple(){ return ripple._register.apply(this, arguments) }
}

if (client) {
  var expose = attr(document.currentScript, 'utils')
  is.str(expose) && utils(...expose.split(' ').filter(Boolean))
  client && (window.ripple = createRipple())
}