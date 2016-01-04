var through = require('through2')
  
module.exports = function (file) {
  return through(function (buf, enc, next) {
    var contents = buf.toString('utf8')
    contents = contents.replace(/^.*utilise\/client[^]*?var (.*) = _interop.*$/gm, '')
    contents = contents.replace(/_client2.default/gm, 'true')
    contents = contents.replace(/require\('utilise\/client'\)/gi, 'true')

    // TODO minify only
    // remove log statements
    // contents = contents.replace(/log = require\(([^,]*)/gm, 'log = require("utilise/identity")')
    // contents = contents.replace(/err = require\(([^,]*)/gm, 'err = require("utilise/identity")')
    // contents = contents.replace(/(0, _group2.default)/gm, '(function(_,f){f()})')

    this.push(contents)
    next()
  })
}