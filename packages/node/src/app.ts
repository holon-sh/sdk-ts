import { readFileSync } from "node:fs";
import { fromJsonSchema } from "@modelcontextprotocol/server";
import type {
  JsonSchemaType,
  McpServer,
  ServerContext,
  Tool as McpTool,
} from "@modelcontextprotocol/server";

/** The SDK request context, including cancellation and authenticated request metadata. */
export type Context = ServerContext;
/** A JSON resource declaration. `holon types generate` supplies its JSON Schema. */
export interface Resource<T> {
  readonly kind: "resource";
  readonly uri: string;
  readonly read: (context: Context) => T | Promise<T>;
}
/** Native MCP tool metadata plus the resources a successful call changes. */
export interface ToolOptions<O>
  extends Omit<McpTool, "name" | "inputSchema" | "outputSchema"> {
  /** Resources to notify after a successful call. A refresh declaration, not authorization or a transaction. */
  changes?: readonly Resource<unknown>[];
  /** Human-readable MCP text accompanying the structured result; defaults to the JSON output. */
  text?: (output: O) => string;
}
/** A typed tool declaration. `holon types generate` supplies its JSON Schemas. */
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
/** Declare a typed operation. No request is executed during declaration. */
export function tool<I, O>(
  options: ToolOptions<O>,
  run: Tool<I, O>["run"],
): Tool<I, O> {
  return { kind: "tool", options, run };
}

interface Contract {
  tools: {
    name: string;
    description?: string;
    inputSchema: JsonSchemaType;
    outputSchema: JsonSchemaType;
  }[];
  resources?: { uri: string; outputSchema: JsonSchemaType }[];
}

/**
 * Register declarations on a native server with the schemas `holon types generate` wrote.
 * Fails before registering anything when the generated catalog differs from the declarations.
 * @param server The server to register on; it advertises `resources.subscribe` itself.
 * @param declarations Tools and resources keyed by their MCP names.
 * @param changed Publishes a resource update to subscribers, for example
 * `uri => handler.notify.resourceUpdated(uri)`. Without it, `changes` is metadata only.
 */
export function register(
  server: McpServer,
  declarations: {
    tools: Record<string, Tool<any, any>>;
    resources?: Record<string, Resource<any>>;
  },
  changed?: (uri: string) => unknown,
): void {
  let contract: Contract;
  try {
    contract = JSON.parse(
      readFileSync(new URL("./generated/app.json", import.meta.url), "utf8"),
    ).schema;
    if (!contract) throw new Error("No own server contract");
  } catch (cause) {
    throw new Error(
      "Run holon types generate for this app before starting its server.",
      { cause },
    );
  }
  const tools = new Map(contract.tools.map((entry) => [entry.name, entry]));
  const schemas = new Map(
    (contract.resources ?? []).map((entry) => [entry.uri, entry.outputSchema]),
  );
  const names = Object.keys(declarations.tools);
  if (tools.size !== names.length || names.some((name) => !tools.has(name)))
    throw new Error(
      "Generated tools differ from this app; run holon types generate again.",
    );
  const resources = Object.entries(declarations.resources ?? {});
  if (
    schemas.size !== resources.length ||
    resources.some(([, ref]) => !schemas.has(ref.uri))
  )
    throw new Error(
      "Generated resources differ from this app; run holon types generate again.",
    );
  for (const definition of Object.values(declarations.tools))
    for (const ref of definition.options.changes ?? [])
      if (!schemas.has(ref.uri))
        throw new Error(`Unknown changed resource: ${ref.uri}`);

  for (const [name, ref] of resources)
    server.registerResource(
      name,
      ref.uri,
      {
        mimeType: "application/json",
        _meta: { "sh.holon/outputSchema": schemas.get(ref.uri) },
      },
      async (_, context) => ({
        contents: [
          {
            uri: ref.uri,
            mimeType: "application/json",
            text: JSON.stringify(await ref.read(context)),
          },
        ],
      }),
    );
  for (const [name, definition] of Object.entries(declarations.tools)) {
    const schema = tools.get(name)!;
    const { changes = [], text, ...metadata } = definition.options;
    server.registerTool(
      name,
      {
        ...metadata,
        description: metadata.description ?? schema.description,
        inputSchema: fromJsonSchema<any>(schema.inputSchema),
        outputSchema: fromJsonSchema<any>(schema.outputSchema),
        _meta: changes.length
          ? {
              ...metadata._meta,
              "sh.holon/changes": changes.map((ref) => ref.uri),
            }
          : metadata._meta,
      },
      async (input, context) => {
        const output = await definition.run(input, context);
        // A failed notification must not turn a committed write into a failed call.
        for (const ref of changes)
          void Promise.resolve()
            .then(() => changed?.(ref.uri))
            .catch((error) =>
              console.error("Resource notification failed", error),
            );
        return {
          structuredContent: output,
          content: [
            { type: "text", text: text?.(output) ?? JSON.stringify(output) },
          ],
        };
      },
    );
  }
}
