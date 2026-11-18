import type { ToolClient } from "./protocol.js";
import { bindApps, createApps, type EndpointBinding } from "./runtime.js";
// schema/control.json from holon-sh/holon, copied verbatim. A control tool's result never changes (new behavior is a new
// tool), so this copy stays true as the platform moves on.
import contract from "./control.json" with { type: "json" };

type Status = "ok" | "error";
// The types the holon CLI generates for control.json. tests/system.test.ts fails when they differ.
interface Inputs {
  get_traces: { since?: string; status?: Status; tool?: string; limit?: number; before?: string };
}
interface Outputs {
  get_traces: { session: string; app?: string; traces: Array<{ traceId: string; start: string; app?: string; method: string; tool?: string; status: Status; errorCode?: number; durationMs: number }> };
}
type Control = ToolClient<Inputs, Outputs, {}, {}, {}>;

// What the client announces to control, which knows the calling app without it.
const identity = { name: "holon-sh", version: "1" };
const contracts = { control: contract };

/** The platform's app through which this app reads its own MCP calls, at CONTROL_MCP_URL. Holon gives every app one; nothing is declared. */
export const control: Control = createApps(identity, contracts).control as Control;

/** A client for control at another binding, such as a test's server. */
export function createControl(binding: EndpointBinding): Control {
  return bindApps(identity, contracts, { control: binding }).control as Control;
}
