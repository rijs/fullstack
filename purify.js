var through = require('through2')
  
module.exports = function (file) {
  return through(function (buf, enc, next) {
    var contents = buf.toString('utf8')
      , utilities = []
      , pure = contents
          .replace(/^.*utilise\/[^]*?var (.*) = _interop.*$/gm, function($1, $2){ 
            utilities.push($2)
            return '' 
          })
    
    // remove utilities
    utilities.forEach(function(d) { 
      pure = pure.replace(new RegExp(d+'.default','g'), d.slice(1,-1)) })
    pure = pure.replace(/require\('utilise\/(.*?)'\)/gi, 'window.$1')
    pure = pure.replace(/\n\n\n/g, '')
    pure = pure.replace(/process.env/g, '{}')
    console.log('replaced', utilities.length, 'in', file)

    // compile client=true
    pure = pure.replace(/([^-])client/gm, '$1true')

    // TODO minify only
    // remove log statements
    // pure = pure.replace(/log = ([^,]*)/gm, 'log = identity')
    // pure = pure.replace(/err = ([^,]*)/gm, 'err = identity')
    // pure = pure.replace(/(0, group)/gm, '(function(_,f){f()})')
    
    this.push(pure)
    next()
  })
}