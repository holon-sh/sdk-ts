import { createApps as create, bindApps, ToolCallError } from "holon-core";

export { bindApps, ToolCallError };

// Shared with the private @holon-sh/sdk and existing hosts.
const DEFAULT_BINDING = Symbol.for("@holon-sh/sdk/default-binding");

// Unbound clients fall back to <NAME>_MCP_URL when the resolver returns undefined.
export function setDefaultBinding(resolve) {
  if (typeof resolve !== "function") throw new TypeError("Binding resolver must be a function.");
  globalThis[DEFAULT_BINDING] = resolve;
}

function environment(identity, name) {
  if (!Object.hasOwn(identity.requires ?? {}, name)) return undefined; // holon-core reports "not declared"
  const variable = `${name.toUpperCase().replaceAll("-", "_")}_MCP_URL`;
  const endpoint = process.env[variable];
  // Environment-bound dependencies connect for one call at a time.
  if (endpoint) return { endpoint, scoped: true };
  throw new Error(`Dependency ${name} is unavailable (${variable}). Provide a binding or set the environment variable.`);
}

export function createApps(identity, contracts, bindings, options) {
  return create(identity, contracts, bindings, { ...options, resolve: name => globalThis[DEFAULT_BINDING]?.(name) ?? environment(identity, name) });
}
