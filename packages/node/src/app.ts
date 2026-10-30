import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import {
  McpServer,
  createMcpHandler,
  fromJsonSchema,
} from "@modelcontextprotocol/server";
import type {
  Implementation,
  ServerContext,
  Tool as McpTool,
  McpRequestContext,
} from "@modelcontextprotocol/server";

/** The SDK request context, including cancellation and authenticated request metadata. */
export type Context = ServerContext;
export interface Resource<T> {
  readonly kind: "resource";
  readonly uri: string;
  readonly read: (context: Context) => T | Promise<T>;
}
export interface ToolOptions<O>
  extends Omit<McpTool, "name" | "inputSchema" | "outputSchema"> {
  /** Resources invalidated after a successful operation. This is not a transaction. */
  changes?: readonly Resource<unknown>[];
  /** Human-readable MCP text accompanying the structured result. */
  text?: (output: O) => string;
}
export interface Tool<I, O> {
  readonly kind: "tool";
  readonly options: ToolOptions<O>;
  readonly run: (input: I, context: Context) => O | Promise<O>;
}
/** Declare typed readable state. No request is executed during declaration. */
export function resource<T>(
  uri: string,
  read: Resource<T>["read"],
): Resource<T> {
  return { kind: "resource", uri, read };
}
/** Declare a typed operation. `holon types generate` supplies its JSON Schemas. */
export function tool<I, O>(
  options: ToolOptions<O>,
  run: Tool<I, O>["run"],
): Tool<I, O> {
  return { kind: "tool", options, run };
}
export interface AppContract {
  tools: McpTool[];
  resources?: { uri: string; outputSchema: Record<string, unknown> }[];
}
export interface AppOptions {
  tools: Record<string, Tool<any, any>>;
  resources?: Record<string, Resource<any>>;
  /** Override generated schemas when composing with another contract producer. */
  contract?: AppContract;
  /** Manifest emitted by holon-ui/build; paths inside it are relative to this URL. */
  views?: URL;
  /** Register native MCP tools, resources, prompts, and middleware on each server. */
  configure?: (server: McpServer, context?: McpRequestContext) => void;
}
type ViewAsset = {
  tool: string;
  uri: string;
  file: string;
  ui?: Record<string, unknown>;
};

/**
 * Create a standard MCP HTTP handler with a createServer factory for stdio hosts.
 * Generated schemas validate both arguments and results. Native context is passed
 * through unchanged; permission checks remain in application/SDK middleware.
 */
export function createApp(info: Implementation, options: AppOptions) {
  const contract: AppContract =
    options.contract ??
    (() => {
      try {
        const value = JSON.parse(
          readFileSync(
            new URL("./generated/app.json", import.meta.url),
            "utf8",
          ),
        );
        if (!value.schema) throw new Error("No own server contract");
        return value.schema;
      } catch (cause) {
        throw new Error(
          "Run holon types generate for this app before starting its server.",
          { cause },
        );
      }
    })();
  const schemas = new Map(contract.tools.map((entry) => [entry.name, entry]));
  const resourceSchemas = new Map(
    (contract.resources ?? []).map((entry) => [entry.uri, entry.outputSchema]),
  );
  const checks = new Map(
    [...resourceSchemas].map(([uri, schema]) => [uri, fromJsonSchema(schema)]),
  );
  if (
    schemas.size !== Object.keys(options.tools).length ||
    Object.keys(options.tools).some((name) => !schemas.has(name))
  ) {
    throw new Error(
      "Generated tools differ from this app; run holon types generate again.",
    );
  }
  const resources = Object.entries(options.resources ?? {});
  if (
    resourceSchemas.size !== resources.length ||
    resources.some(([, ref]) => !resourceSchemas.has(ref.uri))
  ) {
    throw new Error(
      "Generated resources differ from this app; run holon types generate again.",
    );
  }
  for (const definition of Object.values(options.tools))
    for (const ref of definition.options.changes ?? []) {
      if (!resourceSchemas.has(ref.uri))
        throw new Error(`Unknown changed resource: ${ref.uri}`);
    }
  const views: ViewAsset[] = options.views
    ? JSON.parse(readFileSync(options.views, "utf8"))
    : [];
  for (const view of views)
    if (!schemas.has(view.tool) || !view.uri.startsWith("ui://"))
      throw new Error("Invalid view manifest");
  const createServer = (request?: McpRequestContext) => {
    const server = new McpServer(info, {
      capabilities: { resources: { subscribe: resources.length > 0 } },
    });
    for (const [name, ref] of resources)
      server.registerResource(
        name,
        ref.uri,
        {
          mimeType: "application/json",
          _meta: { "sh.holon/outputSchema": resourceSchemas.get(ref.uri)! },
        },
        async (_, context) => {
          const value = await ref.read(context);
          const checked = await checks
            .get(ref.uri)!
            ["~standard"].validate(value);
          if (checked.issues)
            throw new Error(
              `Invalid resource ${ref.uri}: ${JSON.stringify(checked.issues)}`,
            );
          return {
            ttlMs: 0,
            cacheScope: "private",
            contents: [
              {
                uri: ref.uri,
                mimeType: "application/json",
                text: JSON.stringify(value),
              },
            ],
          };
        },
      );
    for (const [name, definition] of Object.entries(options.tools)) {
      const schema = schemas.get(name)!;
      const { changes = [], text, ...metadata } = definition.options;
      const view = views.find((view) => view.tool === name);
      server.registerTool(
        name,
        {
          ...metadata,
          description: metadata.description ?? schema.description,
          inputSchema: fromJsonSchema<any>(
            schema.inputSchema as Parameters<typeof fromJsonSchema>[0],
          ),
          ...(schema.outputSchema
            ? { outputSchema: fromJsonSchema<any>(schema.outputSchema) }
            : {}),
          _meta: {
            ...metadata._meta,
            "sh.holon/changes": changes.map((ref) => ref.uri),
            ...(view
              ? {
                  ui: {
                    ...(metadata._meta?.ui as object),
                    resourceUri: view.uri,
                  },
                }
              : {}),
          },
        },
        async (input, context) => {
          const output = await definition.run(input, context);
          // A failed notification must not turn a committed write into a retryable action failure.
          for (const ref of changes) {
            void Promise.resolve()
              .then(() => handler.notify.resourceUpdated(ref.uri))
              .catch((error) =>
                console.error("Resource notification failed", error),
              );
          }
          return {
            structuredContent: output,
            content: [
              { type: "text", text: text?.(output) ?? JSON.stringify(output) },
            ],
          };
        },
      );
    }
    for (const view of views)
      server.registerResource(
        view.tool,
        view.uri,
        { mimeType: "text/html;profile=mcp-app" },
        async () => ({
          contents: [
            {
              uri: view.uri,
              mimeType: "text/html;profile=mcp-app",
              text: await readFile(new URL(view.file, options.views!), "utf8"),
              _meta: {
                ui: {
                  csp: { connectDomains: [], resourceDomains: [] },
                  ...view.ui,
                },
              },
            },
          ],
        }),
      );
    options.configure?.(server, request);
    return server;
  };
  const handler = createMcpHandler(createServer, { legacy: "stateless" });
  return Object.assign(handler, { createServer });
}
