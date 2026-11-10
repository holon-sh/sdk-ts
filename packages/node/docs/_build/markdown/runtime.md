[Holon TypeScript SDK](modules.md) / runtime

# runtime

## Interfaces

<a id="binding"></a>

### Binding

Connection settings for an MCP endpoint.

#### Properties

<a id="authprovider"></a>

##### authProvider?

> `optional` **authProvider?**: [`AuthProvider`](protocol.md#authprovider)

Authentication provider; use application-owned credentials.

<a id="endpoint"></a>

##### endpoint

> **endpoint**: `string` \| `URL`

Streamable HTTP MCP endpoint.

<a id="fetch"></a>

##### fetch?

> `optional` **fetch?**: \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

Custom fetch implementation, for example for an in-process transport.

###### Call Signature

> (`input`, `init?`): `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

###### Parameters

###### input

`URL` \| `RequestInfo`

###### init?

`RequestInit`

###### Returns

`Promise`\<`Response`\>

###### Call Signature

> (`input`, `init?`): `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

###### Parameters

###### input

`string` \| `URL` \| `Request`

###### init?

`RequestInit`

###### Returns

`Promise`\<`Response`\>

<a id="installationuid"></a>

##### installationUID?

> `optional` **installationUID?**: `string`

Optional X-Holon-Installation-UID routing header.

<a id="scoped"></a>

##### scoped?

> `optional` **scoped?**: `boolean`

Close the session after every call instead of keeping one connection open.

***

<a id="contract"></a>

### Contract

Generation-time tool and JSON resource schemas. A null contract permits unvalidated callTool requests.

#### Properties

<a id="resources"></a>

##### resources?

> `optional` **resources?**: `object`[]

###### outputSchema

> **outputSchema**: `Record`\<`string`, `unknown`\>

###### uri

> **uri**: `string`

<a id="tools"></a>

##### tools

> **tools**: `object`[]

###### inputSchema

> **inputSchema**: `Record`\<`string`, `unknown`\>

###### name

> **name**: `string`

###### outputSchema?

> `optional` **outputSchema?**: `Record`\<`string`, `unknown`\>

***

<a id="createoptions"></a>

### CreateOptions

Optional validation, binding resolution, and host-session hooks.

#### Type Parameters

<a id="b"></a>

##### B

`B` = [`Binding`](#binding)

#### Properties

<a id="resolve"></a>

##### resolve?

> `optional` **resolve?**: (`app`) => [`Binding`](#binding) \| `undefined`

Binding of an app created without explicit bindings; consulted on every call.

###### Parameters

###### app

`string`

###### Returns

[`Binding`](#binding) \| `undefined`

<a id="session"></a>

##### session?

> `optional` **session?**: (`app`, `binding`) => [`ToolSession`](#toolsession) \| `undefined`

Session for a binding the runtime does not connect to itself (anything without an endpoint).

###### Parameters

###### app

`string`

###### binding

`B`

###### Returns

[`ToolSession`](#toolsession) \| `undefined`

<a id="validator"></a>

##### validator?

> `optional` **validator?**: (`schema`) => (`value`) => `boolean`

JSON Schema validator factory. The default uses Ajv.

###### Parameters

###### schema

`object`

###### Returns

(`value`) => `boolean`

***

<a id="identity"></a>

### Identity

Calling application identity and its declared dependencies.

#### Properties

<a id="name"></a>

##### name

> **name**: `string`

<a id="requires"></a>

##### requires?

> `optional` **requires?**: `Record`\<`string`, \{ `name?`: `string`; `version?`: `string`; \}\>

<a id="version"></a>

##### version

> **version**: `string`

***

<a id="toolsession"></a>

### ToolSession

The subset of an MCP client a session must provide.

#### Methods

<a id="calltool"></a>

##### callTool()

> **callTool**(`request`, `options?`): `Promise`\<`any`\>

###### Parameters

###### request

###### arguments?

`Record`\<`string`, `unknown`\>

###### name

`string`

###### options?

`Record`\<`string`, `unknown`\>

###### Returns

`Promise`\<`any`\>

<a id="listtools"></a>

##### listTools()

> **listTools**(`params?`, `options?`): `Promise`\<`any`\>

###### Parameters

###### params?

`undefined`

###### options?

`Record`\<`string`, `unknown`\>

###### Returns

`Promise`\<`any`\>

<a id="readresource"></a>

##### readResource()

> **readResource**(`request`, `options?`): `Promise`\<`any`\>

###### Parameters

###### request

###### uri

`string`

###### options?

`Record`\<`string`, `unknown`\>

###### Returns

`Promise`\<`any`\>

## Type Aliases

<a id="endpointbinding"></a>

### EndpointBinding

> **EndpointBinding** = [`Binding`](#binding)

Alias for an endpoint binding.

***

<a id="runtimeclient"></a>

### RuntimeClient

> **RuntimeClient** = [`ToolClient`](protocol.md#toolclient)\<`Record`\<`string`, `Record`\<`string`, `unknown`\>\>, `Record`\<`string`, `unknown`\>, `Record`\<`string`, `unknown`\>\>

Untyped client returned by the low-level runtime. Generated clients specialize its inputs, outputs, and resources.

## Functions

<a id="bindapps"></a>

### bindApps()

> **bindApps**\<`B`\>(`identity`, `contracts`, `bindings`, `options?`): `Readonly`\<`Record`\<`string`, [`RuntimeClient`](#runtimeclient)\>\>

Construct only the explicitly bound dependencies. Unknown names throw; an empty binding map selects none. Used by generated createApps factories.

#### Type Parameters

<a id="b-1"></a>

##### B

`B` = [`Binding`](#binding)

#### Parameters

##### identity

[`Identity`](#identity)

##### contracts

`Record`\<`string`, [`Contract`](#contract) \| `null`\>

##### bindings

`Record`\<`string`, `B`\>

##### options?

[`CreateOptions`](#createoptions)\<`B`\>

#### Returns

`Readonly`\<`Record`\<`string`, [`RuntimeClient`](#runtimeclient)\>\>

***

<a id="createapps"></a>

### createApps()

> **createApps**\<`B`\>(`identity`, `contracts`, `bindings?`, `options?`): `Readonly`\<`Record`\<`string`, [`RuntimeClient`](#runtimeclient)\>\>

Construct runtime clients from identity and contracts. Connections open lazily. Explicit and resolved endpoint bindings reuse one session unless scoped is true; <NAME>_MCP_URL bindings use one session per call. Close persistent clients on shutdown. Most callers use the generated package root.

#### Type Parameters

<a id="b-2"></a>

##### B

`B` = [`Binding`](#binding)

#### Parameters

##### identity

[`Identity`](#identity)

##### contracts

`Record`\<`string`, [`Contract`](#contract) \| `null`\>

##### bindings?

`Record`\<`string`, `B`\>

##### options?

[`CreateOptions`](#createoptions)\<`B`\>

#### Returns

`Readonly`\<`Record`\<`string`, [`RuntimeClient`](#runtimeclient)\>\>

***

<a id="setdefaultbinding"></a>

### setDefaultBinding()

> **setDefaultBinding**(`resolve`): `void`

For hosts: register a process-wide resolver for clients created without explicit bindings. Explicit bindings take precedence; return undefined to fall back to the <NAME>_MCP_URL environment variable. Register during startup.

#### Parameters

##### resolve

(`app`) => [`Binding`](#binding) \| `undefined`

#### Returns

`void`

## References

<a id="authprovider-1"></a>

### AuthProvider

Re-exports [AuthProvider](protocol.md#authprovider)

***

<a id="callmetadata"></a>

### CallMetadata

Re-exports [CallMetadata](protocol.md#callmetadata)

***

<a id="calloptions"></a>

### CallOptions

Re-exports [CallOptions](protocol.md#calloptions)

***

<a id="elicithandler"></a>

### ElicitHandler

Re-exports [ElicitHandler](protocol.md#elicithandler)

***

<a id="toolcallerror"></a>

### ToolCallError

Re-exports [ToolCallError](protocol.md#toolcallerror)

***

<a id="toolcalloptions"></a>

### ToolCallOptions

Re-exports [ToolCallOptions](protocol.md#toolcalloptions)

***

<a id="toolclient"></a>

### ToolClient

Re-exports [ToolClient](protocol.md#toolclient)

***

<a id="toolresult"></a>

### ToolResult

Re-exports [ToolResult](protocol.md#toolresult)
