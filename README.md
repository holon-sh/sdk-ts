# Holon TypeScript SDK

[![CI](https://github.com/holon-sh/sdk-ts/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/holon-sh/sdk-ts/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-holon--labs.dev-blue)](https://holon-labs.dev/docs/)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org/en/download)
[![Apache 2.0 License](https://img.shields.io/badge/license-Apache--2.0-green)](https://github.com/holon-sh/sdk-ts/blob/main/LICENSE)
[![Discord](https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white)](https://discord.gg/jXExyBdy)

This repository contains the Node.js runtime for [`holon`](https://github.com/holon-sh/cli).

## Install

```sh
npm install holon-sh@dev
npm install -D holon-types typescript
```

`holon-types` is the `holon` CLI. `holon types check` brings its own TypeScript compiler and uses the project's `typescript` when one is installed.

## Create an app

```sh
npx create-holon-app foo
```

## Invoking MCP Servers

Declare dependencies under `sh.holon.requires` in a [`server.json`](https://modelcontextprotocol.io/registry/quickstart#step-4-create-server-json) beside the server, here the public [Hugging Face](https://huggingface.co/docs/hub/en/hf-mcp-server) MCP server:

```json
{
  "name": "com.example/foo",
  "version": "0.1.0",
  "description": "Example Foo",
  "_meta": {
    "io.modelcontextprotocol.registry/publisher-provided": {
      "sh.holon": {
        "requires": {
          "huggingface": { "url": "https://huggingface.co/mcp" }
        }
      }
    }
  }
}
```

### Type-checking MCP invocations

```sh
npx holon types check
```

A wrong tool name or argument is a type error:

```ts
import { apps } from "#holon-sh";

await apps.huggingface.tools.hub_repo_search({ query: "llama" });

await apps.huggingface.tools.hub_repo_search({ limit: "3" });
// error TS2322: Type 'string' is not assignable to type 'number'.

await apps.huggingface.tools.hub_repo_details({});
// error TS2741: Property '"repo_ids"' is missing in type '{}' but required in type '{ config?: string | undefined; limit?: number | undefined; offset?: number | undefined; operations?: ("dataset_preview" | "dataset_structure" | "overview")[] | undefined; repo_ids: string[]; repo_type?: "dataset" | ... 2 more ... | undefined; split?: string | undefined; }'.

await apps.huggingface.tools.hub_search({ query: "llama" });
// error TS2339: Property 'hub_search' does not exist on type '{ readonly hf_fs: (input: { operations: { args: string[]; cmd: "attach" | "cat" | "find" | "ls" | "search" | "stat"; }[]; }, options?: ToolCallOptions | undefined) => Promise<{ results: ({ ...; } | { ...; })[]; truncated?: boolean | undefined; truncation_reason?: "output_budget" | undefined; }>; readonly hf_whoami: ...'.
```

## Events

A server tells its clients what happens with [MCP Events](https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md), a draft extension of the MCP Triggers & Events Working Group. The draft may change, and this follows it.

A server declares an event type and emits its occurrences:

```ts
import { createEvents } from "holon-sh/events";

const events = createEvents();
const said = events.event("room.said", {
  description: "Someone said something in a room",
  inputSchema: z.object({ room: z.string() }),
  payloadSchema: z.object({ text: z.string() }),
  match: ({ room }, args) => room === args.room,
  transform: ({ text }) => ({ text }),
});

const server = new McpServer({ name: "rooms", version: "1.0.0" });
events.serve(server);

said.emit({ room: "lobby", text: "hello" });
```

A client subscribes and iterates:

```ts
const subscription = await apps.rooms.events.subscribe("room.said", { room: "lobby" });
for await (const { data } of subscription) console.log(data.text);
```

The client is pushed each event on a stream where the server offers one and polls otherwise. It reconnects by itself and resumes from its cursor. Emitted events are kept in the server's memory, so after a restart the client's `onGap` is called: read the current state again.

To hand a page its state and then its changes, a tool returns the state together with `said.cursor()`, read in the same synchronous run, and the page subscribes from that cursor: it hears every change after the state, and none twice. Occurrences emitted one after another in one run reach each subscriber in that order with nothing of the same type between them, so a group of changes is emitted together or sent as one occurrence holding a list.

A source that keeps its own history is read through a check function instead. Its cursor is the source's own, so a client resumes across restarts with nothing skipped. Polls are answered by it, streams ask it every `interval`, and the type can still `emit` to push at once:

```ts
events.event("email.received", {
  inputSchema: z.object({ from: z.string() }),
  payloadSchema: z.object({ subject: z.string() }),
  interval: 30_000,
  check: async (cursor, { from }) => {
    if (cursor === null) return { events: [], cursor: await mailbox.head() };
    const { messages, head } = await mailbox.since(cursor, from);
    return { events: messages.map(m => ({ eventId: m.id, data: { subject: m.subject } })), cursor: head };
  },
});
```

An event type may also say who may subscribe, and hear when subscriptions begin and end:

```ts
const said = events.event("room.said", {
  // ...
  authorize: ({ room }, context) => mayRead(getContext(context).principal, room),
  onSubscribe: ({ id, arguments: { room } }) => {
    const listener = upstream.join(room, text => said.emit({ room, text }, { subscription: id }));
    return () => listener.leave();
  },
});

said.end(id);   // ends one subscription; said.end() ends them all
said.remove();  // stops offering the type; createEvents({ listChanged: true }) also tells clients
```

A refused subscription is answered Forbidden, and access is checked again at each poll and heartbeat. A subscription begins when its stream opens or its first poll arrives, and ends when its last stream closes or polls stop for a while. For a signed-in caller its `id` is the same for the same user, client, agent, scopes, event type and arguments, so what is emitted to it while its client reconnects is still delivered. A caller without an identity gets a new id for each stream, and its polls share one lease per arguments with every such caller, to which nothing is emitted alone. `createEvents` takes what each type keeps (`keep: { events, age }`), the `interval` of polls and checks, and limits on subscriptions in all and per caller.

Poll and push delivery are here, with check functions, targeted emits, subscription hooks, authorization, ending subscriptions, limits, paged listing and removing event types. Webhook delivery is below. Typed event names are not here yet. A client learns that the event types changed only on a connection that lasts, such as stdio: over stateless HTTP it lists them again.

### Webhook delivery

A server delivers by webhook too when `createEvents` is given the mode. Nothing else changes: `emit` reaches webhook subscribers as it does the others.

```ts
import { webhooks } from "holon-sh/webhooks";

const events = createEvents({ modes: [webhooks()] });
```

The SDK keeps each subscription, checks that its callback wants deliveries before sending any, signs each one per [Standard Webhooks](https://www.standardwebhooks.com/), retries failures, and drops a subscription its client stops refreshing. Only an authenticated caller can subscribe, and only an `https` callback at a public address is called. A type's `authorize`, hooks, `end`, `remove` and the limits of `createEvents` apply to webhook subscriptions as to the others, and access is checked again every minute. Subscriptions are kept in memory; give `webhooks({ store })` to keep them across restarts, and delivery to them resumes as soon as the process declares their event types.

A client that can be reached mounts a receiver at a URL and gives both to `createApps`. Its subscriptions then use webhooks wherever a server offers them:

```ts
import { createApps } from "#holon-sh";
import { createReceiver } from "holon-sh/webhooks";

const receiver = createReceiver();
const apps = createApps({ rooms: { endpoint } }, { webhook: { url: "https://app.example/hooks", receiver } });
// Answer POSTs to /hooks with receiver(request), which returns the Response.

const subscription = await apps.rooms.events.subscribe("room.said", { room: "lobby" });
```

The receiver checks each delivery's signature and age, answers the server's challenge, drops repeats, and hands each event to its subscription. The client refreshes the subscription before it lapses and unsubscribes when it ends. A Holon app cannot serve its own routes yet, so a receiver runs in a server of your own.

## Community

Ask questions and share what you're building on the [Holon Discord](https://discord.gg/jXExyBdy).
