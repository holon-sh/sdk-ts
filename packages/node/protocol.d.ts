import type { CallToolRequest, CallToolResult, InputRequiredResult, InputResponses, ListToolsResult, RequestOptions } from "@modelcontextprotocol/client";

/** Bearer-token or OAuth provider accepted by the MCP transport. */
export type AuthProvider =
  | { token(): Promise<string | undefined>; onUnauthorized?(context: unknown): Promise<void> }
  | { tokens(): unknown; redirectUrl: unknown; clientMetadata: unknown };

/** MCP request options, including AbortSignal and timeout in milliseconds. Input-required responses are enabled by the runtime. */
export type CallOptions = Omit<RequestOptions, "allowInputRequired">;
/** MCP request metadata and input continuation fields. Pass inputResponses and requestState when continuing an input-required result. */
export type CallMetadata = Omit<CallToolRequest["params"], "name" | "arguments"> & { inputResponses?: InputResponses; requestState?: string };
/** @internal */
type Fields<T> = { [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K] };
/** Full tool result: successful typed output, an application error, or an input-required continuation. */
export type ToolResult<Output> =
  | (Omit<Fields<CallToolResult>, "structuredContent" | "isError"> & { resultType: "complete"; isError?: false; structuredContent: Output })
  | (Omit<Fields<CallToolResult>, "structuredContent" | "isError"> & { resultType: "complete"; isError: true; structuredContent?: unknown })
  | InputRequiredResult;

/** Error thrown by the tools convenience methods for tool_error or input_required results. Inspect app, tool, code, and the original result; use callTool for continuation workflows. */
export declare class ToolCallError extends Error {
  readonly code: "tool_error" | "input_required";
  readonly app: string;
  readonly tool: string;
  readonly result: Extract<ToolResult<unknown>, { isError: true } | { resultType: "input_required" }>;
  constructor(app: string, tool: string, result: ToolCallError["result"]);
}

/** Client operations shared by generated app clients. Transport, validation, and protocol errors reject the returned promises. */
export interface ToolClient<I, O, R> {
  /** Close the cached endpoint session. Scoped calls close their own session; a host-owned session is closed by its host. */
  readonly close: () => Promise<void>;
  /** Fetch the live tool catalog. */
  readonly listTools: (options?: CallOptions) => Promise<ListToolsResult>;
  /** Contracted JSON resources. read validates the first text content as JSON. watch requires an endpoint binding to a server that supports subscriptions; it reads the initial value, then listens for updates until aborted. */
  readonly resources: { readonly [U in keyof R]: {
    readonly read: (options?: CallOptions) => Promise<R[U]>;
    readonly watch: (onChange: (value: R[U]) => void | Promise<void>, options?: { signal?: AbortSignal }) => Promise<void>;
  } };
  /** Convenience methods returning structured output. Error or input-required results throw ToolCallError. Reserved object method names remain callable through callTool. */
  readonly tools: { readonly [K in Exclude<keyof I, "then" | "toJSON" | "toString" | "valueOf" | "toLocaleString">]: (input: I[K], options?: CallOptions) => Promise<K extends keyof O ? O[K] : unknown> };
  /** Return the full MCP result, preserving error and input-required results. Arguments and successful output are contract-validated. */
  readonly callTool: <K extends keyof I & string>(request: CallMetadata & { name: K; arguments: I[K] }, options?: CallOptions) => Promise<ToolResult<K extends keyof O ? O[K] : unknown>>;
}
