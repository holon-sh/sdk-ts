import type { AuthProvider } from "./runtime/protocol.js";

/** Where and how to reach an app that the program did not bind explicitly. */
export interface Binding {
  endpoint: URL | string;
  authProvider?: AuthProvider;
  fetch?: typeof fetch;
  installationUID?: string;
  /** Close the session after every call instead of keeping one connection open. */
  scoped?: boolean;
}

const DEFAULT_BINDING = Symbol.for("@holon-sh/sdk/default-binding");

/**
 * Resolve bindings for generated app clients that were not bound with `createApps`. Without a resolver, or when it
 * returns `undefined`, a client falls back to its `<NAME>_MCP_URL` environment variable.
 */
export function setDefaultBinding(resolve: (app: string) => Binding | undefined): void {
  if (typeof resolve !== "function") throw new TypeError("Binding resolver must be a function.");
  (globalThis as { [DEFAULT_BINDING]?: typeof resolve })[DEFAULT_BINDING] = resolve;
}
