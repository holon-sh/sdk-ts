import type { AuthProvider as BearerAuthProvider, CallToolRequest, CallToolResult, ElicitRequestParams, ElicitResult, InputRequiredResult, InputResponses, ListToolsResult, OAuthClientProvider, RequestOptions } from "@modelcontextprotocol/client";
import type { Download } from "./ext/files.js";

/** Bearer-token or OAuth provider accepted by the MCP transport. */
export type AuthProvider = BearerAuthProvider | OAuthClientProvider;
/** Answers a server's question so the call that asked can complete. `params.mode` tells a form from a URL to open. */
export type ElicitHandler = (params: ElicitRequestParams) => ElicitResult | Promise<ElicitResult>;

/** MCP request options, including AbortSignal and timeout in milliseconds. A request without a timeout waits for its answer; progress from the server restarts a timeout. Input-required responses are enabled by the runtime. */
export type CallOptions = Omit<RequestOptions, "allowInputRequired">;
/** Call options for a tool. `elicit` answers its questions in place, so the call returns the completed result. */
export type ToolCallOptions = CallOptions & { elicit?: ElicitHandler };
/** MCP request metadata and input continuation fields. Pass inputResponses and requestState when continuing an input-required result. */
export type CallMetadata = Omit<CallToolRequest["params"], "name" | "arguments"> & { inputResponses?: InputResponses; requestState?: string };
type Fields<T> = { [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K] };
type Files = {
  /** Files the tool returned, from a server with the files extension. Their targets are removed from _meta. */
  downloads?: Download[];
};
/** Successful tool result with contract-typed structured content. */
export type CompleteResult<Output> = Omit<Fields<CallToolResult>, "structuredContent" | "isError"> & Files & { resultType: "complete"; isError?: false; structuredContent: Output };
/** Full tool result: successful typed output, an application error, or an input-required continuation. */
export type ToolResult<Output> =
  | CompleteResult<Output>
  | (Omit<Fields<CallToolResult>, "structuredContent" | "isError"> & Files & { resultType: "complete"; isError: true; structuredContent?: unknown })
  | InputRequiredResult;

function json(text: string | undefined): unknown {
  try { return text === undefined ? undefined : JSON.parse(text); } catch { return undefined; }
}

/** Error thrown by the tools convenience methods for error or input_required results. A failure's message carries its text; `data` is what the server said in a form to branch on. Pass elicit to answer questions in place, or continue later through callTool. */
export class ToolCallError extends Error {
  readonly result: Extract<ToolResult<unknown>, { isError: true } | { resultType: "input_required" }>;
  /** The failure's text content, its text blocks joined by newlines. Undefined for questions left unanswered. */
  readonly text?: string;
  /** The failure's structured content, or else its text parsed as JSON when that text is JSON. Its shape is the server's own. */
  readonly data?: unknown;
  constructor(app: string, tool: string, result: ToolCallError["result"]) {
    const asking = result.resultType === "input_required";
    const text = (asking ? undefined : result.content?.filter(part => part.type === "text").map(part => part.text).join("\n")) || undefined;
    // A question says what it asks, and a URL question where to answer it.
    const detail = asking
      ? Object.values(result.inputRequests ?? {}).flatMap(question => question.method === "elicitation/create"
        ? [question.params.message, question.params.mode === "url" ? question.params.url : undefined]
        : []).filter(Boolean).join(" ")
      : text;
    super(`${app}.${tool}: ${asking ? "additional input required" : "tool failed"}${detail ? `: ${detail}` : ""}`);
    this.name = "ToolCallError";
    this.result = result;
    this.text = text;
    this.data = result.structuredContent ?? json(text);
  }
}

/** Client operations shared by generated app clients. Transport, validation, and protocol errors reject the returned promises. A Blob at a file argument (x-mcp-file) is sent with the files extension: inline when the server takes it, else uploaded to the target the server names. A failure before the call completes says whether the tool did not run or the outcome is unknown. */
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
  /** Convenience methods returning structured output, or the complete MCP result, with its content blocks typed, for a tool without an output schema. Error results throw ToolCallError, as do questions left unanswered. Reserved object method names remain callable through callTool. */
  readonly tools: { readonly [K in Exclude<keyof I, "then" | "toJSON" | "toString" | "valueOf" | "toLocaleString">]: (input: I[K], options?: ToolCallOptions) => Promise<K extends keyof O ? O[K] : CompleteResult<unknown>> };
  /** Return the full MCP result, preserving error results and questions left unanswered. Successful output is contract-validated; the server validates arguments. */
  readonly callTool: <K extends keyof I & string>(request: CallMetadata & { name: K; arguments: I[K] }, options?: ToolCallOptions) => Promise<ToolResult<K extends keyof O ? O[K] : unknown>>;
}
