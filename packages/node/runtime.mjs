import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { validator as defaultValidator } from "./validate.mjs";

// Environment-bound calls reuse the last server/discover result for the same endpoint and token instead of discovering
// the server on every call.
const DISCOVERY = Symbol("discovery");
const discovered = new Map();

function environment(identity, name) {
  if (!Object.hasOwn(identity.requires ?? {}, name)) return undefined;
  const prefix = `${name.toUpperCase().replaceAll("-", "_")}_MCP_`;
  const endpoint = process.env[`${prefix}URL`];
  // Environment-bound dependencies connect for one call at a time, sending <NAME>_MCP_TOKEN as the bearer token when it is set.
  const token = process.env[`${prefix}TOKEN`];
  if (endpoint) return { endpoint, scoped: true, [DISCOVERY]: `${endpoint} ${token ?? ""}`, ...(token && { authProvider: { token: async () => token } }) };
  throw new Error(`Dependency ${name} is unavailable (${prefix}URL). Provide a binding or set the environment variable.`);
}

function json(text) {
  try { return JSON.parse(text); } catch { return undefined; }
}

export class ToolCallError extends Error {
  constructor(app, tool, result) {
    const asking = result.resultType === "input_required";
    const text = result.content?.filter(part => part.type === "text").map(part => part.text).join("\n") || undefined;
    const detail = asking
      ? Object.values(result.inputRequests ?? {}).flatMap(({ params }) => [params?.message, params?.url]).filter(Boolean).join(" ")
      : text;
    super(`${app}.${tool}: ${asking ? "additional input required" : "tool failed"}${detail ? `: ${detail}` : ""}`);
    this.name = "ToolCallError";
    this.result = result;
    this.text = text;
    this.data = result.structuredContent ?? json(text);
  }
}

function validate(check, value, label) {
  if (!check(value)) throw new Error(`Invalid ${label}: ${JSON.stringify(check.errors)}`);
}

function untilAborted(promise, signal) {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const aborted = () => reject(signal.reason);
    signal.addEventListener("abort", aborted, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", aborted));
  });
}

// The MCP client ends a request after 60 s unless given a timeout. A request without one waits as long as a timer can
// (2^31 - 1 ms, about 24.8 days). A request with one asks for progress, and progress restarts its timeout.
function patient(options) {
  return options?.timeout === undefined
    ? { ...options, timeout: 2 ** 31 - 1 }
    : { onprogress: () => {}, resetTimeoutOnProgress: true, ...options };
}

// Requests outside the core protocol are checked by their callers.
const anything = { "~standard": { version: 1, vendor: "holon-sh", validate: value => ({ value: value ?? {} }) } };
// A stream that has said nothing for twice the longest heartbeat interval is dead: https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md#lifecycle
const QUIET = 60_000;

function delay(milliseconds, signal) {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}

export function bindApps(identity, contracts, bindings, options) {
  const selected = Object.fromEntries(Object.keys(bindings).map(name => {
    if (!Object.hasOwn(contracts, name) && !Object.hasOwn(identity.requires ?? {}, name)) throw new Error("Unknown app binding: " + name);
    return [name, contracts[name] ?? null];
  }));
  return createApps(identity, selected, bindings, options);
}

export function createApps(identity, contracts, bindings, options) {
  const { validator = defaultValidator, resolve = name => environment(identity, name), session: hosted } = options ?? {};
  const apps = Object.create(null);
  // Without explicit bindings, every declared dependency gets a client; those without a contract are untyped.
  const members = { ...(bindings ? {} : Object.fromEntries(Object.keys(identity.requires ?? {}).map(name => [name, null]))), ...contracts };
  for (const [name, contract] of Object.entries(members)) {
    const binding = bindings?.[name];
    // Without explicit bindings, the resolve hook supplies the binding on every call.
    const current = () => binding ?? (bindings ? undefined : resolve(name));
    let connection;
    const connect = (resolved, discover) => {
      // Every client can be asked: a call answers with elicit, or the question reaches its caller. Servers must not assume a client answers: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr#server-requirements-basic-workflow
      // On 2026-07-28 the client sends these capabilities in every request's _meta: https://github.com/modelcontextprotocol/typescript-sdk/blob/fcef852f6cdafea07f36cf6fae69b37c8adf85be/packages/client/src/client/client.ts#L700-L711
      const client = new Client({ name: identity.name, version: identity.version }, { capabilities: { elicitation: { form: {}, url: {} } }, versionNegotiation: { mode: "auto" } });
      const transport = new StreamableHTTPClientTransport(new URL(resolved.endpoint), { authProvider: resolved.authProvider, fetch: async (input, init) => {
        const response = await (resolved.fetch ?? fetch)(input, init);
        current.answered ||= response.ok;
        return response;
      }, requestInit: { credentials: "include", redirect: "error", headers: resolved.installationUID ? { "X-Holon-Installation-UID": resolved.installationUID } : {} } });
      const current = { client, close: async () => {
        await transport.close();
        await current.ready.catch(() => {});
      } };
      transport.onclose = () => { if (connection === current) connection = undefined; };
      current.ready = client.connect(transport, discover && { prior: { kind: "modern", discover } }).catch(async error => {
        await transport.close();
        throw error;
      });
      return current;
    };
    // The session hook serves bindings the runtime does not connect to itself.
    const host = binding && hosted?.(name, binding);
    const session = async (options, run) => {
      options?.signal?.throwIfAborted();
      if (host) return run(host);
      const resolved = current();
      if (!resolved) throw new Error(Object.hasOwn(identity.requires ?? {}, name)
        ? `Dependency ${name} is unavailable. Provide a binding.`
        : `Dependency ${name} is not declared by this application.`);
      if (!resolved.endpoint) throw new Error(`Dependency ${name} binding has no endpoint.`);
      // Bindings marked scoped connect for one call at a time.
      const scoped = resolved.scoped === true;
      const key = resolved[DISCOVERY];
      const prior = discovered.get(key);
      const active = scoped ? connect(resolved, prior) : (connection ??= connect(resolved));
      try {
        await untilAborted(active.ready, options?.signal);
        if (key) discovered.set(key, active.client.getDiscoverResult());
        return await run(active.client);
      } catch (error) {
        // A server that no longer speaks the discovered protocol rejects the first request without running it.
        if (!prior || active.answered || error?.status !== 400) throw error;
        discovered.delete(key);
        return session(options, run);
      } finally { if (scoped) await active.close(); }
    };
    const tools = Object.create(null);
    const definitions = new Map((contract?.tools ?? []).map(definition => [definition.name, { definition }]));
    const callTool = async (request, { elicit, ...options } = {}) => {
      const tool = definitions.get(request.name);
      if (!tool && contract) throw new Error(`Unknown tool ${name}.${request.name}.`);
      const result = await session(options, async client => {
        const send = request => client.callTool(request, {
          ...patient(options), allowInputRequired: true,
          ...(tool && { toolDefinition: { ...tool.definition, outputSchema: undefined } }),
        });
        let result = await send(request);
        // A server may keep asking, so answering stops after ten rounds, the MCP clients' own limit, and the last question reaches the caller.
        for (let round = 0; elicit && result.resultType === "input_required" && round < 10; round++) {
          const inputResponses = {};
          for (const [key, { params }] of Object.entries(result.inputRequests ?? {})) inputResponses[key] = await elicit(params);
          result = await send({ ...request, inputResponses, requestState: result.requestState });
        }
        return result;
      });
      if (result.resultType === "input_required") return result;
      // The server validates arguments; the client checks the output against the contract it was compiled against.
      if (!result.isError && tool?.definition.outputSchema) {
        validate(tool.output ??= validator(tool.definition.outputSchema), result.structuredContent, `structured output from ${name}.${request.name}`);
      }
      return { ...result, resultType: "complete" };
    };
    const listTools = options => session(options, client => client.listTools(undefined, patient(options)));
    for (const tool of contract?.tools ?? []) if (!["then", "toJSON", "toString", "valueOf", "toLocaleString"].includes(tool.name)) {
      tools[tool.name] = async (input, options) => {
        const result = await callTool({ name: tool.name, arguments: input }, options);
        if (result.resultType === "input_required" || result.isError) throw new ToolCallError(name, tool.name, result);
        return tool.outputSchema ? result.structuredContent : result;
      };
    }
    const resources = Object.create(null);
    for (const resource of contract?.resources ?? []) {
      let valid;
      const parse = result => {
        const value = JSON.parse(result.contents[0].text);
        valid ??= validator(resource.outputSchema);
        validate(valid, value, `contents from ${name} ${resource.uri}`);
        return value;
      };
      const read = async options => parse(await session(options, client => client.readResource({ uri: resource.uri }, patient(options))));
      const watch = async (onChange, { signal } = {}) => {
        const resolved = current();
        if (!resolved?.endpoint) throw new Error(`Watching ${name} ${resource.uri} requires an endpoint binding.`);
        for (let established = false; !signal?.aborted; await delay(1000, signal)) {
          const current = connect(resolved);
          let failure;
          try {
            await untilAborted(current.ready, signal);
            const { client } = current;
            if (!client.getServerCapabilities()?.resources?.subscribe) throw new Error(`${name} does not advertise resource subscriptions.`);
            let reads = Promise.resolve();
            const refresh = () => (reads = reads.then(async () => onChange(parse(await client.readResource({ uri: resource.uri }, patient({ signal, cacheMode: "bypass" })))))
              .catch(error => { failure ??= error; return current.close(); }));
            client.setNotificationHandler("notifications/resources/updated", ({ params }) => { if (params.uri === resource.uri) void refresh(); });
            const subscription = await client.listen({ resourceSubscriptions: [resource.uri] }, { signal });
            if (!subscription.honoredFilter.resourceSubscriptions?.includes(resource.uri)) throw new Error(`${name} did not accept a subscription to ${resource.uri}.`);
            established = true;
            await refresh();
            await subscription.closed;
          } catch (error) {
            failure ??= error;
          } finally {
            await current.close();
          }
          if (signal?.aborted) return;
          if (failure && !established) throw failure;
        }
      };
      resources[resource.uri] = Object.freeze({ read, watch });
    }
    // MCP Events, the draft extension: https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md
    const list = options => session(options, async client => {
      const events = [];
      for (let cursor; ;) {
        const page = await client.request({ method: "events/list", params: { ...(cursor && { cursor }) } }, anything, patient(options));
        events.push(...page.events ?? []);
        if (!(cursor = page.nextCursor)) return events;
      }
    });
    const subscribe = async (event, args = {}, { signal, onGap, maxAgeMs, ...options } = {}) => {
      const resolved = current();
      if (!resolved?.endpoint) throw new Error(`Subscribing to ${name} ${event} requires an endpoint binding.`);
      const offered = (await list({ signal })).find(type => type.name === event)?.delivery;
      if (!offered) throw new Error(`${name} has no event ${event}.`);
      // Push hears of an event at once, and poll works wherever a request does. Webhook delivery is not supported.
      const delivery = options.delivery ?? ["push", "poll"].find(mode => offered.includes(mode));
      if (!offered.includes(delivery)) throw new Error(`${name} does not deliver ${event} by ${delivery ?? "poll or push"}.`);
      const cancelled = new AbortController();
      const ended = signal ? AbortSignal.any([signal, cancelled.signal]) : cancelled.signal;
      let cursor = options.cursor ?? null;
      const queue = [];
      const seen = new Set();
      let wake = () => {};
      let done = false;
      let failure;
      // An absent cursor is a null one, and a null one is never resumed from.
      const reach = (next, truncated) => {
        cursor = next ?? null;
        if (truncated) onGap?.();
      };
      // The client checks an event's data against the contract it was compiled against, as it does a tool's output.
      const expected = contract?.events?.find(type => type.name === event)?.payloadSchema;
      let valid;
      const deliver = ({ cursor: _, _meta, ...occurrence }) => {
        if (seen.has(occurrence.eventId)) return;
        seen.add(occurrence.eventId);
        if (seen.size > 1024) seen.delete(seen.values().next().value);
        if (expected) validate(valid ??= validator(expected), occurrence.data, `data of ${name} ${event}`);
        queue.push(occurrence);
        wake();
      };
      const request = { name: event, arguments: args, ...(maxAgeMs !== undefined && { maxAgeMs }) };
      let confirmed = false;
      let established;
      const active = new Promise((resolve, reject) => { established = { resolve: () => { confirmed = true; resolve(); }, reject }; });
      // A server's refusal ends the subscription. Anything else is tried again from the cursor.
      const refused = error => error?.status >= 400 && error.status < 500 || error?.data?.status >= 400 && error.data.status < 500;
      const poll = async () => {
        while (!ended.aborted) {
          let wait = 1000;
          try {
            const result = await session({ signal: ended }, client => client.request({ method: "events/poll", params: { ...request, cursor } }, anything, patient({ signal: ended })));
            try { for (const occurrence of result.events ?? []) deliver(occurrence); } catch (error) { failure = error; return cancelled.abort(); }
            reach(result.cursor, result.truncated);
            established.resolve();
            // A server that asks for a tight loop is not obeyed.
            wait = result.hasMore ? 0 : Math.max(1000, result.nextPollMs ?? 0);
          } catch (error) {
            if (ended.aborted) return;
            if (!confirmed || refused(error)) throw error;
          }
          await delay(wait, ended);
        }
      };
      const stream = async () => {
        while (!ended.aborted) {
          const quiet = new AbortController();
          // The MCP client keeps waiting for the answer of a request whose stream has ended, so the end is watched for here.
          const watched = async (input, init) => {
            const response = await (resolved.fetch ?? fetch)(input, init);
            if (!response.body || !response.headers.get("content-type")?.startsWith("text/event-stream")) return response;
            const reader = response.body.getReader();
            const body = new ReadableStream({
              pull: controller => reader.read().then(({ done, value }) => {
                if (!done) return controller.enqueue(value);
                controller.close();
                // The answer, when the stream ended with one, is handled first.
                setTimeout(() => quiet.abort());
              }, error => { controller.error(error); quiet.abort(); }),
              cancel: reason => reader.cancel(reason),
            });
            return new Response(body, response);
          };
          // Each stream has its own connection, so every event notification on it is this subscription's.
          const connection = connect({ ...resolved, fetch: watched });
          let timer;
          const heard = () => {
            clearTimeout(timer);
            timer = setTimeout(() => quiet.abort(), QUIET);
          };
          let terminated;
          try {
            await untilAborted(connection.ready, ended);
            const on = (method, handle) => connection.client.setNotificationHandler(`notifications/events/${method}`, { params: anything }, params => { heard(); handle(params); });
            on("active", ({ cursor: next, truncated }) => { reach(next, truncated); established.resolve(); });
            on("event", occurrence => {
              try { deliver(occurrence); } catch (error) { failure = error; return cancelled.abort(); }
              reach(occurrence.cursor);
            });
            on("heartbeat", ({ cursor: next }) => reach(next));
            // The server recovers from an error by itself, and the stream stays open.
            on("error", () => {});
            on("terminated", ({ error }) => { terminated = error; quiet.abort(); });
            heard();
            await connection.client.request({ method: "events/stream", params: { ...request, cursor } }, anything, { signal: AbortSignal.any([ended, quiet.signal]), timeout: 2 ** 31 - 1 });
          } catch (error) {
            if (!terminated && !ended.aborted && (!confirmed || refused(error))) throw error;
          } finally {
            clearTimeout(timer);
            await connection.close();
          }
          if (terminated) throw Object.assign(new Error(`${name} ended the subscription to ${event}: ${terminated?.message}`), { code: terminated?.code, data: terminated?.data });
          await delay(1000, ended);
        }
      };
      void (delivery === "push" ? stream() : poll())
        .catch(error => { failure ??= error; })
        .finally(() => { done = true; wake(); established.reject(failure ?? ended.reason); });
      await active;
      return {
        delivery,
        get cursor() { return cursor; },
        cancel: () => cancelled.abort(),
        [Symbol.asyncIterator]: () => ({
          next: async () => {
            while (!queue.length && !done) await new Promise(resolve => { wake = resolve; });
            if (queue.length) return { value: queue.shift(), done: false };
            if (failure) throw failure;
            return { value: undefined, done: true };
          },
          return: async () => { cancelled.abort(); return { value: undefined, done: true }; },
        }),
      };
    };
    apps[name] = Object.freeze({ callTool, listTools, events: Object.freeze({ list, subscribe }), resources: Object.freeze(resources), close: async () => { await connection?.close(); }, tools: Object.freeze(tools) });
  }
  return Object.freeze(apps);
}
