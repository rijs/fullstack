const define = require('@compone/define')
    , style = require('@compone/style')

module.exports = define('x-foo', async (node, state) => {
  await style(node, await ripple.get('x-foo.css'))

  node.innerHTML = await ripple.get('some-data')
})