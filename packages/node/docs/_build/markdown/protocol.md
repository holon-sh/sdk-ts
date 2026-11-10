[Holon TypeScript SDK](modules.md) / protocol

# protocol

## Classes

<a id="toolcallerror"></a>

### ToolCallError

Error thrown by the tools convenience methods for error or input_required results. A failure's message carries its text; `data` is what the server said in a form to branch on. Pass elicit to answer questions in place, or continue later through callTool.

#### Extends

- `Error`

#### Constructors

<a id="constructor"></a>

##### Constructor

> **new ToolCallError**(`app`, `tool`, `result`): [`ToolCallError`](#toolcallerror)

###### Parameters

###### app

`string`

###### tool

`string`

###### result

`InputRequiredResult` \| `Omit`\<`Fields`\<\{\[`key`: `string`\]: `unknown`; \}\>, `"structuredContent"` \| `"isError"`\> & `object`

###### Returns

[`ToolCallError`](#toolcallerror)

###### Overrides

`Error.constructor`

#### Properties

<a id="data"></a>

##### data?

> `readonly` `optional` **data?**: `unknown`

The failure's structured content, or else its text parsed as JSON when that text is JSON. Its shape is the server's own.

<a id="result"></a>

##### result

> `readonly` **result**: `InputRequiredResult` \| `Omit`\<`Fields`\<\{\[`key`: `string`\]: `unknown`; \}\>, `"structuredContent"` \| `"isError"`\> & `object`

<a id="text"></a>

##### text?

> `readonly` `optional` **text?**: `string`

The failure's text content, its text blocks joined by newlines. Undefined for questions left unanswered.

## Interfaces

<a id="toolclient"></a>

### ToolClient

Client operations shared by generated app clients. Transport, validation, and protocol errors reject the returned promises.

#### Type Parameters

<a id="i"></a>

##### I

`I`

<a id="o"></a>

##### O

`O`

<a id="r"></a>

##### R

`R`

#### Properties

<a id="calltool"></a>

##### callTool

> `readonly` **callTool**: \<`K`\>(`request`, `options?`) => `Promise`\<[`ToolResult`](#toolresult)\<`K` *extends* keyof `O` ? `O`\[`K`\] : `unknown`\>\>

Return the full MCP result, preserving error results and questions left unanswered. Arguments and successful output are contract-validated.

###### Type Parameters

###### K

`K` *extends* `string`

###### Parameters

###### request

`Omit`\<\{ \}, `"name"` \| `"arguments"`\> & `object` & `object`

###### options?

[`ToolCallOptions`](#toolcalloptions)

###### Returns

`Promise`\<[`ToolResult`](#toolresult)\<`K` *extends* keyof `O` ? `O`\[`K`\] : `unknown`\>\>

<a id="close"></a>

##### close

> `readonly` **close**: () => `Promise`\<`void`\>

Close the cached endpoint session. Scoped calls close their own session; a host-owned session is closed by its host.

###### Returns

`Promise`\<`void`\>

<a id="listtools"></a>

##### listTools

> `readonly` **listTools**: (`options?`) => `Promise`\<\{\[`key`: `string`\]: `unknown`; \}\>

Fetch the live tool catalog.

###### Parameters

###### options?

[`CallOptions`](#calloptions)

###### Returns

`Promise`\<\{\[`key`: `string`\]: `unknown`; \}\>

<a id="resources"></a>

##### resources

> `readonly` **resources**: \{ readonly \[U in string \| number \| symbol\]: \{ read: (options?: CallOptions) =\> Promise\<R\[U\]\>; watch: (onChange: (value: R\[U\]) =\> void \| Promise\<void\>, options?: \{ signal?: AbortSignal \}) =\> Promise\<void\> \} \}

Contracted JSON resources. read validates the first text content as JSON. watch requires an endpoint binding to a server that supports subscriptions; it reads the initial value, then listens for updates until aborted.

<a id="tools"></a>

##### tools

> `readonly` **tools**: \{ readonly \[K in string \| number \| symbol\]: (input: I\[K\], options?: ToolCallOptions) =\> Promise\<K extends keyof O ? O\[K\] : CompleteResult\<unknown\>\> \}

Convenience methods returning structured output, or the complete MCP result, with its content blocks typed, for a tool without an output schema. Error results throw ToolCallError, as do questions left unanswered. Reserved object method names remain callable through callTool.

## Type Aliases

<a id="authprovider"></a>

### AuthProvider

> **AuthProvider** = \{ `onUnauthorized?`(`context`): `Promise`\<`void`\>; `token`(): `Promise`\<`string` \| `undefined`\>; \} \| \{ `clientMetadata`: `unknown`; `redirectUrl`: `unknown`; `tokens`(): `unknown`; \}

Bearer-token or OAuth provider accepted by the MCP transport.

***

<a id="callmetadata"></a>

### CallMetadata

> **CallMetadata** = `Omit`\<`CallToolRequest`\[`"params"`\], `"name"` \| `"arguments"`\> & `object`

MCP request metadata and input continuation fields. Pass inputResponses and requestState when continuing an input-required result.

#### Type Declaration

##### inputResponses?

> `optional` **inputResponses?**: `InputResponses`

##### requestState?

> `optional` **requestState?**: `string`

***

<a id="calloptions"></a>

### CallOptions

> **CallOptions** = `Omit`\<`RequestOptions`, `"allowInputRequired"`\>

MCP request options, including AbortSignal and timeout in milliseconds. A request without a timeout waits for its answer; progress from the server restarts a timeout. Input-required responses are enabled by the runtime.

***

<a id="completeresult"></a>

### CompleteResult

> **CompleteResult**\<`Output`\> = `Omit`\<`Fields`\<`CallToolResult`\>, `"structuredContent"` \| `"isError"`\> & `object`

Successful tool result with contract-typed structured content.

#### Type Parameters

<a id="output"></a>

##### Output

`Output`

#### Type Declaration

##### isError?

> `optional` **isError?**: `false`

##### resultType

> **resultType**: `"complete"`

##### structuredContent

> **structuredContent**: `Output`

***

<a id="elicithandler"></a>

### ElicitHandler

> **ElicitHandler** = (`params`) => `ElicitResult` \| `Promise`\<`ElicitResult`\>

Answers a server's question so the call that asked can complete. `params.mode` tells a form from a URL to open.

#### Parameters

##### params

`ElicitRequestParams`

#### Returns

`ElicitResult` \| `Promise`\<`ElicitResult`\>

***

<a id="toolcalloptions"></a>

### ToolCallOptions

> **ToolCallOptions** = [`CallOptions`](#calloptions) & `object`

Call options for a tool. `elicit` answers its questions in place, so the call returns the completed result.

#### Type Declaration

##### elicit?

> `optional` **elicit?**: [`ElicitHandler`](#elicithandler)

***

<a id="toolresult"></a>

### ToolResult

> **ToolResult**\<`Output`\> = [`CompleteResult`](#completeresult)\<`Output`\> \| `Omit`\<`Fields`\<`CallToolResult`\>, `"structuredContent"` \| `"isError"`\> & `object` \| `InputRequiredResult`

Full tool result: successful typed output, an application error, or an input-required continuation.

#### Type Parameters

<a id="output-1"></a>

##### Output

`Output`
