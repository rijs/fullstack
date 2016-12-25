# Ripple Fullstack

On the server:

**`index.js`**
```js
const ripple = require('rijs')({ dir: __dirname })
```

On the client: 

**`pages/index.html`**
```html
<script src="/ripple.js"></script>
```

Run it:

```
$ node index.js
```

This starts up a server on a random port and statically serves your `/pages` directory. You can also specify a `port` to always use, or pass an existing HTTP `server` (e.g. from express). 

Clients will then just be streamed the fine-grained resources they are using (i.e. everything is lazy loaded, no bundling, no over-fetching). 

Ripple keeps clients/servers in sync by replicating an immutable log of actions in the background, and subsequently the view - or other modules - which are reactively updated when the local store is updated.

That's it! No boilerplate necessary, no build pipeline, no special transpilation, no magical CLI.

The basic API is:

```js
ripple(name)        // getter
ripple(name, body)  // setter
ripple.on('change', (name, change) => { .. })
```

&nbsp; 
## Components

Let's add a (Web) Component to the page:

**`index.html`**
```diff
<script src="/ripple.js"></script>
+ <my-app></my-app>
```

Let's define the component:

**`resources/my-app.js:`**

```js
export default () => ()
```

Ripple is agnostic to _how_ you write your components, they should just be idempotent: a single render function. 

This is fine:

**`resources/my-app.js:`**

```js
export default (node, data) => node.innerHTML = 'Hello World!'
```

Or using some DOM-diff helper:

**`resources/my-app.js:`**

```js
export default (node, data) => jsx(node)`<h1>Hello World</h1>`
```

Or using [once](https://github.com/utilise/once#once)/D3 joins:

**`resources/my-app.js:`**

```js
export default (node, data) => {
  once(node)
    ('h1', 1)
      .text('Hello World')
})
```

For more info about writing idempotent components, see [this spec](https://github.com/pemrouz/vanilla).

&nbsp;
## State/Data

The first parameter of the component is the node to update. 

The second parameter contains all the state and data the component needs to render:

```js
export default function component(node, data){ ... }
```

* You can inject data resources by adding the name of the resources to the data attribute:

    ```html
    <my-shop data="stock">
    ```

    ```js
    export default function shop({ stock }){ ... }
    ```

    Declaring the data needed on a component is used to reactively rerender it when the data changes. 

    Alternatively, you can use `ripple.pull` directly to retrieve a resource, which has similar semantics to [dynamic `import()`](https://github.com/tc39/proposal-dynamic-import) (i.e. resolves from local cache or returns a single promise):

    ```js
    const dependency = await pull('dependency')
    ```

* The other option is to explicitly pass down data to the component from the parent:

    ```js
    once(node)
      ('my-shop', { stock })
    ```

    The helper function will set the state and redraw, so redrawing a parent will redraw it's children. If you want to do it yourself:

    ```js
    element.state = { stock }
    element.draw()
    ```

&nbsp;
## Defaults

You can set defaults using the ES6 syntax:

```js
export default function shop({ stock = [] }){ ... }
```

If you need to persist defaults on the component's state object, you can use a small [helper function](https://github.com/utilise/utilise#--defaults):

```js
export default function shop(state){ 
  const stock = defaults(state, 'stock', [])
}
```

&nbsp;
## Updates

#### Local state

Whenever you need to update local state, just change the `state` and invoke a redraw (like a game loop):

```js
export default function abacus(node, state){ 
  const o = once(node)
      , { counter = 0 } = state

  o('span', 1)
    .text(counter)

  o('button', 1)
    .text('increment')
    .on('click.increment' d => {
      state.counter++
      o.draw()
    })
}
```

#### Global state

Whenever you need to update global state, you can simply compute the new value and register it again which will trigger an update:

```js
ripple('stock', {
  apples: 10
, oranges: 20
, pomegranates: 30
})
```

Or if you just want to change a part of the resource, use a [functional operator](https://github.com/utilise/utilise#--set) to apply a finer-grained diff and trigger an update:

```js
update('pomegranates', 20)(ripple('stock'))
// same as: set({ type: 'update', key: 'pomegranate', value: 20 })(ripple('stock'))
```

Using logs of atomic diffs combines the benefits of immutability with a saner way to synchronise state across a distributed environment.

Components are rAF batched by default. You can access the list of all relevant changes since the last render in your component via `node.changes` to make it more performant if necessary.

&nbsp;
## Events

Dispatch an event on the root element to communicate changes to parents (`node.dispatchEvent`).

&nbsp;
## Routing

Routing is handled by your top-level component: Simply parse the URL to determine what children to render and invoke a redraw of your application when the route has changed: 

```js
export function app(node, data){
  const o = once(node)
      , { pathname } = location

  o('page-dashboard', pathname == '/dashboard')
  o('page-login', pathname == '/login')
 
  once(window)
    .on('popstate.nav', d => o.draw())
}
```

This solution is not tied to any library, and you may not need one at all. 

For advanced uses cases, checkout [decouter](https://github.com/pemrouz/decouter).

&nbsp;
## Styling

You can author your stylesheets assuming they are completely isolated, using the Web Component syntax (`:host` etc).

They will either be inserted in the shadow root of the element, or scoped and added to the head if there is no shadow.

By default, the CSS resource `component-name.css` will be automatically applied to the component `component-name`.

But you can apply multiple stylesheets to a component too: just extend the `css` attribute. 

&nbsp;
## Folder Convention

All files in your `/resources` folder will be automatically registered (except tests etc). You can organise it as you like, but I recommend using the convention: a folder for each component (to co-locate JS, CSS and tests), and a `data` folder for the resources that make up your domain model.

```
resources
├── data
│   ├── stock.js
│   ├── order.js
│   └── ...
├── my-app
│   ├── my-app.js
│   ├── my-app.css
│   └── test.js
├── another-component
│   ├── another-component.js
│   ├── another-component.css
│   └── test.js
└── ...
```

Hot reloading works out of the box. Any changes to these files will be instantly reflected everywhere.

&nbsp;
## Loading Resources

You can also get/set resources yourselves imperatively:

```js
ripple(name)       // getter
ripple(name, body) // setter
```

Or for example import resources from other packages:

```js
ripple
  .resource(require('external-module-1'))
  .resource(require('external-module-2'))
  .resource(require('external-module-3'))
```

&nbsp;
## Offline

Resources are currently cached in `localStorage`. 

This means even _before_ any network interaction, your application renders the last-known-good-state for a superfast startup. 

Then as resources are streamed in, the relevant parts of the application are updated.

Note: Caching of resources will be improved by using ServiceWorkers under the hood instead soon ([#27](https://github.com/rijs/fullstack/issues/27))

&nbsp;
## Render Middleware

By default the draw function just invokes the function on an element. You can extend this without any framework hooks using the explicit decorator pattern:

```js
// in component
export default function component(node, data){
  middleware(node, data)
}

// around component
export default middleware(function component(node, data){
  
})

// for all components
ripple.draw = middleware(ripple.draw)
```

A few useful middleware included in this build are:

### Needs

[This middleware](https://github.com/rijs/needs#ripple--needs) reads the `needs` header and applies the attributes onto the element. The component does not render until all dependencies are available. This is useful when a component needs to define its own dependencies. You can also supply a function to dynamically calculate the required resources.

```js
export default {
  name: 'my-component'
, body: function(){}
, headers: { needs: '[css=..][data=..]' }
}
```

### Helpers

[This middleware](https://github.com/rijs/helpers#ripple--helpers) makes the specified helper functions available from the resource (hidden properties). This is useful to co-locate all logic for each resource in one place.

```js
export default {
  name: 'stock'
, body: {}
, headers: { helpers: { addNewStock, removeStock }}
} 
```

### Shadow

If supported by the browser, a shadow root will be created for each component. The component will render into the shadow DOM rather than the light DOM.


### Perf (Optional)

This one is not included by default, but you can use this to log out the time each component takes to render.

Other debugging tips: 

* Check `ripple.resources` for a snapshot of your application. Resources are in the [tuple format](https://github.com/rijs/core#ripple--core) `{ name, body, headers }`.

* Check `$0.state` on an element to see the state object it was last rendered with or manipulate it.

&nbsp;
## Sync

Ripple uses declarative transformation functions to define the flow of data between server-client. All changes flow through these functions which may return a different representation. The concept is analogous to, but more generic than, "request-response" in HTTP. In request-response, you have to make a request to get a response. If you decouple this, consider that you could receive a response without a request, or make a request with multiple responses, or make a request that does not have a response.

There are two proxy functions (`from` and `to`) which you can define in the headers section:

```js
ripple('tweets', [], { from, to })
```

#### **`to ({ key, value, type, socket })`**

All outgoing changes will be passed through this first. This function is used to send a different representation to a client, if at all. 

Returning `false` will not send the resource at all, useful for privatising some resources:

```js
to = req => false
```

Returning `true` will just continue with streaming the `change`. If you return anything else, it will stream that representation instead.

For example, the following will collapse and just send the total number of tweets. Whenever there is a change to the `tweets` resource, a push will still be triggered to broadcast to all clients so they are still always up to date, but instead of transferring an array of all tweets, they will just get the total count representation now:

```js
to = req => (req.value = req.value.length, req)
```

You can vary representations based on authentication. Each socket has a `sessionID` which you could use to lookup whether that user has logged in or not, and send a different representation if so:

```js
to = req => users[req.socket.sessionID] ? req : filter(req)
```

#### **`from ({ key, value, type, socket }, res)`**

All incoming changes will be passed through this first. This function is used to process a change before Ripple commits it in-memory and triggers a change notification. 

Typically, you will want to check the `type` (method/verb) and then delegate to the appropiate function. For example, there may be different actions you want to take on a `user` resource:

```js
const from = (req, res) => 
  req.type == 'register' ? register(req, res)
: req.type == 'forgot'   ? forgot(req, res)
: req.type == 'logout'   ? logout(req, res)
: req.type == 'reset'    ? reset(req, res)
: req.type == 'login'    ? login(req, res)
                         : res(405, err('method not allowed', req.type))
```

Returning `false` will ignore the change:

```js
from = req => false
```

Ignore all type of changes, except adding new items:

```js
from = req => req.type != 'add'
```

You could choose to ignore whatever change the user made, and take another action instead (Ripple populates the `ip` property on all sockets). Manually updating another resource instead of returning `true` would also trigger a wave of updates to any interested clients/services:

```js
(..) => (push(socket.ip)(audit), false)` 
```

If a user successfully logins, you could force a refresh of _all_ resources for that user since they may now have access to more resources:

```js
(..) => login(username, password).then(d => ripple.send(socket)())` 
```

These declarative transformation functions have a very high power-to-weight ratio and the above examples are just a few illustrative examples.

You can use the `res` function to reply directly to a request. You can reply with any arbitrary arguments. Conventionally, Ripple will set the first parameter to the (HTTP) status code and the message in the second. This happens for example when a resource is not found (`404`), a `type` has not been handled (`405`), or your custom handler threw an exception (`500`).

&nbsp;
## Request-Response

The imperative API for sending all or some requests, to all or some clients is:

```js
const { send } = ripple

send(sockets)(req) // server
  .then(replies => ..)

send(req)          // client
  .then(replies => ..)
```

* `sockets`: could be one socket, an array of sockets, a `sessionID` string identifying some sockets, or nothing which would imply all connected sockets. On the client, you can only send to one socket (the server), so this is pre-bound (i.e. just `send(req)`). 

* `req`: could be the request object you wish to send, the name of a resource to send, an array of either the previous two, or nothing which would imply sending all resources. The `req` object can have any shape, but typically it would look like: 

```js
send({ name, type, value })
```

For which you can use the shortcut:

```js
send(name, type, value)
```

This function returns a promise with all the replies.

**Pro-tip:** If `sockets == ripple`, you can also send requests to the same node to reuse logic in the from handler for that resource and use this is in a redux like manner. This function is aliased as `ripple.req = ripple.send(ripple)`.

```js
const { req } = ripple

req({ name: 'store', type: 'INCREMENT' })
req('store', 'INCREMENT')
  .then(..)
  .catch(..)
```

&nbsp;
## 7 Error Handling

Your request handler can simply throw an error:

```js
// server
function from(req, res) {
  throw new Error('WTF!!')
}
```

The error will be logged and then returned to the client where you can `catch` it.

```js
// client
send(req)
  .then()
  .catch()
```

By default the response status code is `500` and the message is the error message. You can customise the status code returned by also changing the `status` property on the error.

You can also respond directly instead of throwing:

```js
res(500, 'something went wrong!')
```

&nbsp;
## Ripple Minimal

If you have don't have backend for your frontend, checkout [rijs/minimal](https://github.com/rijs/minimal) which is a client-side only build of Ripple.

You can also adjust your own framework by [adding/removing modules](https://github.com/rijs/minimal/blob/master/src/index.js#L1-L11).

&nbsp;
## Docs

See [rijs/docs](https://github.com/rijs/docs) for more guides, index of modules, API reference, etc
