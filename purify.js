var through = require('through2')
  
module.exports = function (file) {
  return through(function (buf, enc, next) {
    var contents = buf.toString('utf8')
      , utilities = []
      , pure = contents
          .replace(/^.*utilise\/[^]*?var (.*) = _interop.*$/gm, function($1, $2, $3){ 
            utilities.push($2)
            return '' 
          })
    
    utilities.forEach(function(d) { 
      pure = pure.replace(new RegExp(d+'.default','g'), d.slice(1,-1)) })
    pure = pure.replace(/require\('utilise\/(.*?)'\)/gi, 'window.$1')
    pure = pure.replace(/\n\n\n/g, '')
    console.log('replaced', utilities.length, 'in', file)
    
    this.push(pure)
    next()
  })
}