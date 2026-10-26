// holon-generated-apps-v1 app=checkout
import type { Outputs as Resources } from "./resources.js";
import type { AuthProvider, CallOptions, CallMetadata, ToolResult, ToolClient } from "../protocol.js";
export { ToolCallError } from "../protocol.js";
export type { Resources };
export interface Inputs {
  "orders": {
    "get_order": { "count"?: number; "orderId": string; [key: string]: unknown; };
    "then": {  };
    "toJSON": {  };
    "unknown_output": {  };
  };
  "with-hyphen": {
    "get_order": { "count"?: number; "orderId": string; [key: string]: unknown; };
    "then": {  };
    "toJSON": {  };
    "unknown_output": {  };
  };
}
export interface Outputs {
  "orders": {
    "get_order": { "total": number; };
    "then": unknown;
    "toJSON": unknown;
    "unknown_output": unknown;
  };
  "with-hyphen": {
    "get_order": { "total": number; };
    "then": unknown;
    "toJSON": unknown;
    "unknown_output": unknown;
  };
}
export interface InputTypes {
  "orders": {
    "get_order": { "OrderId": string; };
    "then": {  };
    "toJSON": {  };
    "unknown_output": {  };
  };
  "with-hyphen": {
    "get_order": { "OrderId": string; };
    "then": {  };
    "toJSON": {  };
    "unknown_output": {  };
  };
}
export interface OutputTypes {
  "orders": {
    "get_order": { "Total": number; };
    "then": {  };
    "toJSON": {  };
    "unknown_output": {  };
  };
  "with-hyphen": {
    "get_order": { "Total": number; };
    "then": {  };
    "toJSON": {  };
    "unknown_output": {  };
  };
}

export type Apps = { readonly [A in keyof Inputs]: ToolClient<Inputs[A], Outputs[A], Resources[A]> };
export declare const apps: Apps;
export interface EndpointBinding { endpoint: URL | string; authProvider?: AuthProvider; fetch?: (input: never, init?: never) => Promise<unknown>; installationUID?: string; scoped?: boolean }
export interface CreateOptions { validator?: (schema: object) => (value: unknown) => boolean }
export declare function createApps<K extends keyof Apps>(bindings: { [A in K]: EndpointBinding }, options?: CreateOptions): Pick<Apps,K>;
