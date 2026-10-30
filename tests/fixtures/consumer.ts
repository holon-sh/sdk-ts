import { apps, ToolCallError, type Inputs, type Outputs, type Resources } from "holon-sh";
import type { ToolClient } from "holon-sh/protocol";
import {createApps as createNodeApps, type EndpointBinding} from "holon-sh";
const scripted = createNodeApps({orders:{endpoint:"https://orders.example/mcp", authProvider:{token: async () => "token"}}});
(await scripted.orders.tools.get_order({orderId:"script"})).total.toFixed();
await scripted.orders.resources["orders://summary"].watch(async (value) => { value.total.toFixed(); }, {signal: new AbortController().signal});
const oauth: EndpointBinding = {endpoint: new URL("https://orders.example/mcp"), authProvider: {tokens: () => undefined, redirectUrl: undefined, clientMetadata: {}}};
createNodeApps({orders: oauth});
// @ts-expect-error
scripted.orders.resources["orders://summary"].watch((value: string) => {});
// @ts-expect-error
createNodeApps({orders:{endpoint:"https://orders.example/mcp", authProvider:{}}});
// @ts-expect-error
createNodeApps({orders:{}});
// @ts-expect-error generated clients require endpoint bindings; custom sessions use the runtime hook
createNodeApps({orders:{host:{callServerTool: async () => ({}), readServerResource: async () => ({})}}});
const summary: Resources["orders"]["orders://summary"] = await apps.orders.resources["orders://summary"].read({signal: new AbortController().signal});
summary.total.toFixed();
// @ts-expect-error
apps.orders.resources["orders://absent"];
const orderId = "ord";
const input: Inputs["orders"]["get_order"] = {orderId};
const result = await apps.orders.tools.get_order(input, {signal: new AbortController().signal});
const client: ToolClient<Inputs["orders"], Outputs["orders"], Resources["orders"]> = apps.orders;
result.total.toFixed();
await apps["with-hyphen"].callTool({name: "then", arguments:{}});
const raw = await apps.orders.callTool({name:"get_order", arguments: {orderId: "ord"}});
if (raw.resultType === "complete" && !raw.isError) raw.structuredContent.total.toFixed();
try { await apps.orders.tools.get_order(input); } catch (error) {
  if (error instanceof ToolCallError) {
    error.app.toUpperCase();
    error.tool.toUpperCase();
    const code: "tool_error" | "input_required" = error.code;
    if (error.result.resultType === "input_required") error.result.requestState?.toUpperCase();
  }
}
// @ts-expect-error
apps.missing;
// @ts-expect-error
apps.orders.tools.missing;
// @ts-expect-error
apps.orders.tools.then;
// @ts-expect-error
apps.orders.tools.toJSON;
// @ts-expect-error
apps.orders.tools.get_order = apps.orders.tools.get_order;
// @ts-expect-error
apps.orders.tools.get_order({orderId: 1});
// @ts-expect-error
apps.orders.tools.get_order({});
// @ts-expect-error
apps.orders.callTool({name:"get_order", arguments:{orderId: 1}});
// @ts-expect-error
apps.orders.callTool({name:"absent", arguments:{}});
// @ts-expect-error
result.invalid;
// @ts-expect-error
raw.structuredContent.total;
if (raw.resultType === "complete" && !raw.isError) {
  // @ts-expect-error
  raw.structuredContent.invalid;
}
const unknown = await apps.orders.tools.unknown_output({});
unknown.content[0]?.type.toUpperCase();
const content: unknown = unknown.structuredContent;
// @ts-expect-error
unknown.total;
// @ts-expect-error
unknown.structuredContent.total;
// @ts-expect-error
unknown.isError === true;
