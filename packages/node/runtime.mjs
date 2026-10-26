import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { validator as defaultValidator } from "./validate.mjs";

// Shared with the private @holon-sh/sdk and existing hosts.
const DEFAULT_BINDING = Symbol.for("@holon-sh/sdk/default-binding");

// Unbound clients fall back to <NAME>_MCP_URL when the resolver returns undefined.
export function setDefaultBinding(resolve) {
  if (typeof resolve !== "function") throw new TypeError("Binding resolver must be a function.");
  globalThis[DEFAULT_BINDING] = resolve;
}

function environment(identity, name) {
  if (!Object.hasOwn(identity.requires ?? {}, name)) return undefined;
  const variable = `${name.toUpperCase().replaceAll("-", "_")}_MCP_URL`;
  const endpoint = process.env[variable];
  // Environment-bound dependencies connect for one call at a time.
  if (endpoint) return { endpoint, scoped: true };
  throw new Error(`Dependency ${name} is unavailable (${variable}). Provide a binding or set the environment variable.`);
}

export class ToolCallError extends Error {
  constructor(app, tool, result) {
    const [code, message] = result.resultType === "input_required"
      ? ["input_required", "additional input required"] : ["tool_error", "tool failed"];
    super(`${app}.${tool}: ${message}.`);
    this.name = "ToolCallError";
    this.code = code;
    this.app = app;
    this.tool = tool;
    this.result = result;
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
  const { validator = defaultValidator, resolve = name => globalThis[DEFAULT_BINDING]?.(name) ?? environment(identity, name), session: hosted } = options ?? {};
  const apps = Object.create(null);
  // Without explicit bindings, every declared dependency gets a client; those without a contract are untyped.
  const members = { ...(bindings ? {} : Object.fromEntries(Object.keys(identity.requires ?? {}).map(name => [name, null]))), ...contracts };
  for (const [name, contract] of Object.entries(members)) {
    const binding = bindings?.[name];
    // Without explicit bindings, the resolve hook supplies the binding on every call.
    const current = () => binding ?? (bindings ? undefined : resolve?.(name));
    let connection;
    const connect = resolved => {
      const client = new Client({ name: identity.name, version: identity.version }, { versionNegotiation: { mode: "auto" } });
      const transport = new StreamableHTTPClientTransport(new URL(resolved.endpoint), { authProvider: resolved.authProvider, fetch: resolved.fetch, requestInit: { credentials: "include", redirect: "error", headers: resolved.installationUID ? { "X-Holon-Installation-UID": resolved.installationUID } : {} } });
      const current = { client, close: async () => {
        await transport.close();
        await current.ready.catch(() => {});
      } };
      transport.onclose = () => { if (connection === current) connection = undefined; };
      current.ready = client.connect(transport).catch(async error => {
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
      const active = scoped ? connect(resolved) : (connection ??= connect(resolved));
      try {
        await untilAborted(active.ready, options?.signal);
        return await run(active.client);
      } finally { if (scoped) await active.close(); }
    };
    const tools = Object.create(null);
    const definitions = new Map((contract?.tools ?? []).map(definition => [definition.name, { definition }]));
    const callTool = async (request, options) => {
      const tool = definitions.get(request.name);
      if (!tool && contract) throw new Error(`Unknown tool ${name}.${request.name}.`);
      let validation;
      if (tool) {
        const { definition } = tool;
        validation = tool.validation ??= {
          input: validator(definition.inputSchema),
          output: definition.outputSchema ? validator(definition.outputSchema) : undefined,
        };
        validate(validation.input, request.arguments, `arguments for ${name}.${request.name}`);
      }
      const result = await session(options, client => client.callTool(request, {
        ...options, allowInputRequired: true,
        ...(tool && { toolDefinition: { ...tool.definition, outputSchema: undefined } }),
      }));
      if (result.resultType === "input_required") return result;
      if (!result.isError && validation?.output) {
        validate(validation.output, result.structuredContent, `structured output from ${name}.${request.name}`);
      }
      return { ...result, resultType: "complete" };
    };
    const listTools = options => session(options, client => client.listTools(undefined, options));
    for (const { definition: tool } of definitions.values()) if (!["then", "toJSON", "toString", "valueOf", "toLocaleString"].includes(tool.name)) {
      tools[tool.name] = async (input, options) => {
        const result = await callTool({ name: tool.name, arguments: input }, options);
        if (result.resultType === "input_required" || result.isError) throw new ToolCallError(name, tool.name, result);
        return result.structuredContent;
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
      const read = async options => parse(await session(options, client => client.readResource({ uri: resource.uri }, options)));
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
            const refresh = () => (reads = reads.then(async () => onChange(parse(await client.readResource({ uri: resource.uri }, { signal, cacheMode: "bypass" }))))
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
    apps[name] = Object.freeze({ callTool, listTools, resources: Object.freeze(resources), close: async () => { await connection?.close(); }, tools: Object.freeze(tools) });
  }
  return Object.freeze(apps);
}
