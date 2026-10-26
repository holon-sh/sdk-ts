// holon-generated-apps-v1 placeholder
export type Apps = Record<never, never>;
export type Inputs = Record<never, never>;
export type Outputs = Record<never, never>;
export type InputTypes = Inputs;
export type OutputTypes = Outputs;
export type Resources = Record<never, never>;
export { ToolCallError } from "../protocol.js";
export type { Binding, EndpointBinding, HostBinding, CreateOptions } from "../runtime.js";
import type { CreateOptions } from "../runtime.js";
export declare function createApps(bindings: Record<string, never>, options?: CreateOptions): Apps;
export { exposeTools, registerPageTools } from "../browser-runtime.js";
