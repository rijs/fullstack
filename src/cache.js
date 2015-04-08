import { client, freeze, log, group, parse, values, header, not } from './utils'

export default function(ripple){
  var resources = ripple._resources()
    , pending

  cache.load = function load(){
    client && group('loading cache', function(){
      var offline = parse(localStorage.ripple)
      values(offline)
        .forEach(ripple)
    })
  }

  return cache
  
  // cache all resources in batches
  function cache() {
    // TODO: Cache to Redis if on server
    if (!client) return;
    clearTimeout(pending)
    var count = resources.length
    pending = setTimeout(function() {
      console.log('count', count, resources.length)
      if (count == resources.length) {
        log('cached')
        var cachable = values(resources)
              .filter(not(header('cache-control', 'no-store')))
        localStorage.ripple = freeze(objectify(cachable))
      }
    }, 2000)      
  } 

}
