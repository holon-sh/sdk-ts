[Holon TypeScript SDK](../modules.md) / src/view

# src/view

## Interfaces

<a id="viewoptions"></a>

### ViewOptions

Allowed network and asset domains for the view content security policy.

#### Properties

<a id="csp"></a>

##### csp?

> `optional` **csp?**: `object`

###### connectDomains?

> `optional` **connectDomains?**: `string`[]

###### resourceDomains?

> `optional` **resourceDomains?**: `string`[]

## Variables

<a id="view_mime_type"></a>

### VIEW\_MIME\_TYPE

> `const` **VIEW\_MIME\_TYPE**: `"text/html;profile=mcp-app"` = `"text/html;profile=mcp-app"`

MIME type of an MCP App HTML resource.

## Functions

<a id="appview"></a>

### appView()

> **appView**(`name`, `uri`, `file`, `options?`): `ViewRegistration`

Create a registration tuple for server.registerResource(...appView(...)).
Node only: the HTML file is read once when this helper is called.
Resource reads reuse that promise; file read failures reject resource requests.

#### Parameters

##### name

`string`

Human-readable resource name.

##### uri

`string`

Resource URI, usually starting with ui://.

##### file

`string` \| `URL`

Built HTML file path or file URL.

##### options?

[`ViewOptions`](#viewoptions) = `{}`

View content security policy.

#### Returns

`ViewRegistration`

Name, URI, metadata, and resource-read callback.

#### Example

```ts
server.registerResource(...appView("App", "ui://app/index.html", new URL("./index.html", import.meta.url)));
```
