# Holon TypeScript SDK

[![CI](https://github.com/holon-sh/sdk-ts/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/holon-sh/sdk-ts/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-holonlabs.ai-blue)](https://holonlabs.ai/docs/)
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

## Streaming a tool's answer

A tool can send its answer in parts as it makes them, such as a model's tokens or a kernel's output. MCP has no partial results, so a part rides on a progress notification of the call, under `_meta["sh.holon/partial"]`. A caller that does not stream, such as `callTool`, sees only the result, so the result is still the whole answer.

```ts
import { streamAnswer } from "holon-sh/context";

server.registerTool("chat", { inputSchema: z.object({ prompt: z.string() }) }, async ({ prompt }, ctx) => {
  const send = streamAnswer<string>(ctx);
  let text = "";
  for await (const token of model.stream(prompt, { signal: ctx.mcpReq.signal })) {
    text += token;
    await send(token);
  }
  return { content: [{ type: "text", text }] };
});
```

```ts
const answer = apps.chat.streamTool({ name: "chat", arguments: { prompt } });
for await (const token of answer) process.stdout.write(String(token));
const result = await answer.result;
```

Leaving the loop early, or aborting the call's `signal`, cancels the call: the server's `ctx.mcpReq.signal` is aborted and its next `send` rejects. No contract describes the parts yet, so a client receives them as `unknown`.

## Events

A server tells its clients what happens with [MCP Events](https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md), a draft extension of the MCP Triggers & Events Working Group. The draft may change, and this follows it, so it lives under `ext`: `holon-sh/ext/events` on a server and `ext.events` on a client. Expect what is there to change.

A server declares an event type and emits its occurrences:

```ts
import { createEvents } from "holon-sh/ext/events";

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
const subscription = await apps.rooms.ext.events.subscribe("room.said", { room: "lobby" });
for await (const { data } of subscription) console.log(data.text);
```

The client is pushed each event on a stream where the server offers one and polls otherwise. It reconnects by itself and resumes from its cursor. Emitted events are kept in the server's memory, so after a restart the client's `onGap` is called: read the current state again.

To hand a page its state and then its changes, a tool returns the state together with `said.cursor()`, read in the same synchronous run, and the page subscribes from that cursor: it hears every change after the state, and none twice. Occurrences emitted one after another in one run reach each subscriber in that order with nothing of the same type between them, so a group of changes is emitted together or sent as one occurrence holding a list.

A source that keeps its own history is read through a check function instead. Its cursor is the source's own, so a client resumes across restarts with nothing skipped. Polls are answered by it, streams ask it every second, and the type can still `emit` to push at once:

```ts
events.event("email.received", {
  inputSchema: z.object({ from: z.string() }),
  payloadSchema: z.object({ subject: z.string() }),
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
  onSubscribe: ({ subscriptionId, arguments: { room } }) => {
    listeners.set(subscriptionId, upstream.join(room, text => said.emit({ room, text }, { subscriptionId })));
  },
  onUnsubscribe: ({ subscriptionId }) => listeners.get(subscriptionId)?.leave(),
});

said.terminate(subscriptionId);  // terminates one subscription; said.terminate() terminates them all
said.remove();                   // stops offering the type
```

A refused subscription is answered Forbidden, and access is checked again at each poll and heartbeat. A subscription begins when its stream opens or its first poll arrives, and ends when its last stream closes or polls stop for a while. For a signed-in caller its `id` is the same for the same user, client, agent, scopes, event type and arguments, so what is emitted to it while its client reconnects is still delivered. A caller without an identity gets a new id for each stream, and its polls share one lease per arguments with every such caller, to which nothing is emitted alone. Each type keeps its last ten thousand events for ten minutes, polls are told to come back every second, a poll subscription ends a minute after its last poll, and subscriptions are limited to ten thousand in all and a thousand per caller. Names follow the design sketch.

Poll, push and webhook delivery are here, with check functions, targeted emits, subscription hooks, authorization, ending subscriptions, limits, paged listing and removing event types. Typed event names are not. Clients are not told when the event types change: they list them again.

### Webhook delivery

A server delivers by webhook too when `createEvents` is given the sketch's `webhookTtl`, the longest lifetime it grants a webhook subscription. Nothing else changes: `emit` reaches webhook subscribers as it does the others. A type with a check function is offered by poll and push only, since webhook delivery sends what is emitted.

```ts
const events = createEvents({ webhookTtl: 30 * 60_000 });
```

The SDK keeps each subscription, checks that its callback wants deliveries before sending any, signs each one per [Standard Webhooks](https://www.standardwebhooks.com/), retries failures, and drops a subscription its client stops refreshing. Only an authenticated caller can subscribe, and only an `https` callback at a public address is called. A type's `authorize`, hooks, `terminate`, `remove` and the limits of `createEvents` apply to webhook subscriptions as to the others, and access is checked again every thirty seconds, at each heartbeat. Subscriptions are kept in memory, so after a restart each comes back when its client next refreshes it.

Every subscription expires unless its client refreshes it: one that never expires would need storage the server does not have. On Holon, an app that delivers webhooks leaves `egress` undeclared in `holon.yaml`, since declared hosts are the only ones it can reach.

Subscribing by webhook is for clients that can be reached at an `https` URL. This client does not subscribe by webhook yet: a Holon app cannot serve the route a receiver needs, so it subscribes by push or poll.

## Community

Ask questions and share what you're building on the [Holon Discord](https://discord.gg/jXExyBdy).
