import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { validator as defaultValidator } from "./validate.mjs";

// Shared across runtime instances and existing hosts.
const DEFAULT_BINDING = Symbol.for("@holon-sh/sdk/default-binding");

// Unbound clients fall back to <NAME>_MCP_URL when the resolver returns undefined.
export function setDefaultBinding(resolve) {
  if (typeof resolve !== "function") throw new TypeError("Binding resolver must be a function.");
  globalThis[DEFAULT_BINDING] = resolve;
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
  const validator = options?.validator ?? defaultValidator;
  const apps = Object.create(null);
  // Without explicit bindings, every declared dependency gets a client; those without a contract are untyped.
  const members = { ...(bindings ? {} : Object.fromEntries(Object.keys(identity.requires ?? {}).map(name => [name, null]))), ...contracts };
  for (const [name, contract] of Object.entries(members)) {
    const binding = bindings?.[name];
    const resolve = () => binding ?? (bindings ? undefined : globalThis[DEFAULT_BINDING]?.(name));
    let connection;
    const connect = (endpoint, resolved) => {
      const client = new Client({ name: identity.name, version: identity.version }, { versionNegotiation: { mode: "auto" } });
      const transport = new StreamableHTTPClientTransport(new URL(endpoint), resolved ? { authProvider: resolved.authProvider, fetch: resolved.fetch, requestInit: { credentials: "include", redirect: "error", headers: resolved.installationUID ? { "X-Holon-Installation-UID": resolved.installationUID } : {} } } : undefined);
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
    const hosted = binding?.host && {
      callTool: (request, { signal, timeout } = {}) => binding.host.callServerTool(request, { signal, timeout }),
      readResource: (request, { signal, timeout } = {}) => binding.host.readServerResource(request, { signal, timeout }),
      listTools: () => { throw new Error(`${name} is bound to its host; the host owns the tool catalog.`); },
    };
    const session = async (options, run) => {
      options?.signal?.throwIfAborted();
      if (hosted) return run(hosted);
      const resolved = resolve();
      if (!resolved && !Object.hasOwn(identity.requires ?? {}, name)) throw new Error(`Dependency ${name} is not declared by this application.`);
      const variable = `${name.toUpperCase().replaceAll("-", "_")}_MCP_URL`;
      const endpoint = resolved?.endpoint ?? (bindings ? undefined : globalThis.process?.env?.[variable]);
      if (!endpoint) throw new Error(`Dependency ${name} is unavailable (${variable}). Provide a binding or set the environment variable.`);
      // Environment-bound dependencies, and bindings marked scoped, connect for one call at a time.
      const scoped = !resolved || resolved.scoped === true;
      const current = scoped ? connect(endpoint, resolved) : (connection ??= connect(endpoint, resolved));
      try {
        await untilAborted(current.ready, options?.signal);
        return await run(current.client);
      } finally { if (scoped) await current.close(); }
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
        if (!validation.input(request.arguments)) throw new Error(`Invalid arguments for ${name}.${request.name}: ${JSON.stringify(validation.input.errors)}`);
      }
      const result = await session(options, client => client.callTool(request, {
        ...options, allowInputRequired: true,
        ...(tool && { toolDefinition: { ...tool.definition, outputSchema: undefined } }),
      }));
      if (result.resultType === "input_required") return result;
      if (!result.isError && validation?.output && !validation.output(result.structuredContent)) {
        throw new Error(`Invalid structured output from ${name}.${request.name}: ${JSON.stringify(validation.output.errors)}`);
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
        if (!valid(value)) throw new Error(`Invalid contents from ${name} ${resource.uri}: ${JSON.stringify(valid.errors)}`);
        return value;
      };
      const read = async options => parse(await session(options, client => client.readResource({ uri: resource.uri }, options)));
      const watch = async (onChange, { signal } = {}) => {
        const resolved = resolve();
        if (!resolved?.endpoint) throw new Error(`Watching ${name} ${resource.uri} requires an endpoint binding.`);
        for (let established = false; !signal?.aborted; await delay(1000, signal)) {
          const current = connect(resolved.endpoint, resolved);
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

export async function exposeTools(app, options = {}) {
  const context = globalThis.document?.modelContext ?? globalThis.navigator?.modelContext;
  if (!context) return false;
  const { signal } = options;
  const execute = options.execute ?? ((name, args) => app.callTool({ name, arguments: args }, { signal }));
  const { tools } = await app.listTools({ signal });
  for (const tool of tools) {
    await context.registerTool({
      name: tool.name, title: tool.title, description: tool.description ?? "", inputSchema: tool.inputSchema, annotations: tool.annotations,
      execute: args => execute(tool.name, args ?? {}),
    }, { signal });
  }
  return true;
}

export async function registerPageTools(tools, { view, signal } = {}) {
  const context = globalThis.document?.modelContext ?? globalThis.navigator?.modelContext;
  const removals = [];
  for (const [name, { description, inputSchema, annotations, execute }] of Object.entries(tools)) {
    if (view) {
      removals.push(view.registerTool(name, { description, inputSchema, annotations }, args => execute(args)).remove);
    } else if (context) {
      const standard = inputSchema["~standard"];
      await context.registerTool({
        name, description, annotations, inputSchema: standard.jsonSchema.input({ target: "draft-2020-12" }),
        execute: async args => {
          const parsed = await standard.validate(args ?? {});
          if (parsed.issues) throw new Error(`Invalid arguments for ${name}: ${JSON.stringify(parsed.issues)}`);
          return execute(parsed.value);
        },
      }, { signal });
    }
  }
  signal?.addEventListener("abort", () => { for (const remove of removals) remove(); }, { once: true });
  return Boolean(view || context);
}
