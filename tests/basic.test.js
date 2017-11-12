(async () => {
  const puppeteer = require('puppeteer')
      , browser = await puppeteer.launch({ headless: process.env.HEADLESS !== 'false' })
      , { emitterify, file, update, keys, delay } = require('utilise/pure')
      , { test } = require('tap')
      
  await test('define, use component on page with stylesheet, hot reload', async ({ plan, same }) => {
    const { ripple, page } = await startup()

    // register component and css
    ripple
      .resource('x-foo', node => (node.innerHTML = 'bar'), { needs: '[css]' })
      .resource('x-foo.css', ':host { color: red }')

    // append to page
    await page.evaluate(() => {
      foo = document.createElement('x-foo')
      document.body.appendChild(foo)
      foo.draw()
    })

    // check rendered
    await page.waitFor('x-foo[css="x-foo.css"]')
    await page.waitFor(() => 
       document.body.firstChild.innerHTML == 'bar'
    && window.getComputedStyle(foo).color == 'rgb(255, 0, 0)'
    )
    
    // register new version of component
    ripple('x-foo', node => (node.innerHTML = 'boo'))
    await page.waitFor(() => document.body.firstChild.innerHTML == 'bar')

    // register new version of css
    ripple('x-foo.css', ':host { color: green }')
    await page.waitFor(() => window.getComputedStyle(foo).color == 'rgb(0, 128, 0)')

    await page.close()
    await browser.close()
  })

  process.exit(0)

  async function startup(){
    const ripple = require('..')({ port: 0 })
    console.log("ripple.server.port", ripple.server.port)
    ripple.server.express.use((req, res) => res.send(`
      <script src="/ripple.js"></script>
    `))

    await ripple.server.once('listening')

    const page = await browser.newPage()

    await page.goto(`http://localhost:${ripple.server.port}`)

    if (process.env.DEBUG == 'true')
      page.on('console', (...args) => console.log('(CLIENT):', ...args))

    return { ripple, page }
  }
})()