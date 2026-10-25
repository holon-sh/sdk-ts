import type { CallToolRequest, CallToolResult, InputRequiredResult, InputResponses, ListToolsResult, RequestOptions } from "@modelcontextprotocol/client";

export type AuthProvider =
  | { token(): Promise<string | undefined>; onUnauthorized?(context: unknown): Promise<void> }
  | { tokens(): unknown; redirectUrl: unknown; clientMetadata: unknown };

export type CallOptions = Omit<RequestOptions, "allowInputRequired">;
export type CallMetadata = Omit<CallToolRequest["params"], "name" | "arguments"> & { inputResponses?: InputResponses; requestState?: string };
type Fields<T> = { [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K] };
export type ToolResult<Output> =
  | (Omit<Fields<CallToolResult>, "structuredContent" | "isError"> & { resultType: "complete"; isError?: false; structuredContent: Output })
  | (Omit<Fields<CallToolResult>, "structuredContent" | "isError"> & { resultType: "complete"; isError: true; structuredContent?: unknown })
  | InputRequiredResult;

export declare class ToolCallError extends Error {
  readonly code: "tool_error" | "input_required";
  readonly app: string;
  readonly tool: string;
  readonly result: Extract<ToolResult<unknown>, { isError: true } | { resultType: "input_required" }>;
  constructor(app: string, tool: string, result: ToolCallError["result"]);
}

export interface ToolClient<I, O, R> {
  readonly close: () => Promise<void>;
  readonly listTools: (options?: CallOptions) => Promise<ListToolsResult>;
  readonly resources: { readonly [U in keyof R]: {
    readonly read: (options?: CallOptions) => Promise<R[U]>;
    readonly watch: (onChange: (value: R[U]) => void | Promise<void>, options?: { signal?: AbortSignal }) => Promise<void>;
  } };
  readonly tools: { readonly [K in Exclude<keyof I, "then" | "toJSON" | "toString" | "valueOf" | "toLocaleString">]: (input: I[K], options?: CallOptions) => Promise<K extends keyof O ? O[K] : unknown> };
  readonly callTool: <K extends keyof I & string>(request: CallMetadata & { name: K; arguments: I[K] }, options?: CallOptions) => Promise<ToolResult<K extends keyof O ? O[K] : unknown>>;
}
