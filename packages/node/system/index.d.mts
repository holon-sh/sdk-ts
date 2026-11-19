// holon-generated-apps-v1 app=system
import type { ToolClient, EndpointBinding, CreateOptions } from "holon-sh/runtime";
export { ToolCallError } from "holon-sh/runtime";
export interface Inputs {
  "control": {
    "get_traces": { "before"?: string; "limit"?: number; "since"?: string; "status"?: ("ok" | "error"); "tool"?: string; };
  };
}
export interface Outputs {
  "control": {
    "get_traces": { "app"?: string; "session": string; "traces": Array<{ "app"?: string; "durationMs": number; "errorCode"?: number; "method": string; "start": string; "status": ("ok" | "error"); "tool"?: string; "traceId": string; }>; };
  };
}
export interface InputTypes {
  "control": {
    "get_traces": {  };
  };
}
export interface OutputTypes {
  "control": {
    "get_traces": {  };
  };
}
export interface Responses {
  "control": {
  };
}
export interface Resources {
  "control": {
  };
}
export interface EventArguments {
  "control": {
  };
}
export interface EventData {
  "control": {
  };
}
export type Events = { readonly [A in keyof EventArguments]: { [K in keyof EventArguments[A]]: { arguments: EventArguments[A][K]; data: K extends keyof EventData[A] ? EventData[A][K] : unknown } } };

export type Apps = { readonly [A in keyof Inputs]: ToolClient<Inputs[A], Outputs[A], Resources[A], Events[A], Responses[A]> };
export declare const apps: Apps;
export type { EndpointBinding, CreateOptions };
export declare function createApps<K extends keyof Apps>(bindings: { [A in K]: EndpointBinding }, options?: CreateOptions): Pick<Apps,K>;
