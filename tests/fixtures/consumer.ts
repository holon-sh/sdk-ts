import { apps, ToolCallError, type Inputs, type Outputs, type Resources } from "#holon-sh";
import type { ToolClient } from "holon-sh/protocol";
import {createApps as createNodeApps, type EndpointBinding} from "#holon-sh";
import { getContext } from "holon-sh/context";
import { EXTENSION, type Download } from "holon-sh/ext/files";
const scripted = createNodeApps({orders:{endpoint:"https://orders.example/mcp", authProvider:{token: async () => "token"}}});
(await scripted.orders.tools.get_order({orderId:"script"})).total.toFixed();
await scripted.orders.resources["orders://summary"].watch(async (value) => { value.total.toFixed(); }, {signal: new AbortController().signal});
const oauth: EndpointBinding = {endpoint: new URL("https://orders.example/mcp"), authProvider: {
  redirectUrl: undefined, clientMetadata: {redirect_uris: []},
  clientInformation: () => undefined, tokens: () => undefined, saveTokens: () => {},
  redirectToAuthorization: () => {}, saveCodeVerifier: () => {}, codeVerifier: () => "verifier",
}, fileOrigins: ["https://storage.example"]};
createNodeApps({orders: oauth});
(await scripted.orders.tools.get_order({orderId:"script"}, {elicit: async ({message}) => ({action: "accept", content: {question: message}})})).total.toFixed();
const summary: Resources["orders"]["orders://summary"] = await apps.orders.resources["orders://summary"].read({signal: new AbortController().signal});
summary.total.toFixed();
const orderId = "ord";
const input: Inputs["orders"]["get_order"] = {orderId};
const result = await apps.orders.tools.get_order(input, {signal: new AbortController().signal});
const client: ToolClient<Inputs["orders"], Outputs["orders"], Resources["orders"]> = apps.orders;
result.total.toFixed();
await apps["with-hyphen"].callTool({name: "then", arguments:{}});
const raw = await apps.orders.callTool({name:"get_order", arguments: {orderId: "ord"}});
if (raw.resultType === "complete" && !raw.isError) raw.structuredContent.total.toFixed();
const whole = await apps.orders.streamTool({name:"get_order", arguments: {orderId: "ord"}}).result;
if (whole.resultType === "complete" && !whole.isError) whole.structuredContent.total.toFixed();
const files: Download[] = raw.resultType === "complete" ? raw.downloads ?? [] : [];
for (const file of files) (await file.blob({signal: new AbortController().signal})).size.toFixed(file.size);
EXTENSION satisfies "io.modelcontextprotocol/files";
try { await apps.orders.tools.get_order(input); } catch (error) {
  if (error instanceof ToolCallError && error.result.resultType === "input_required") error.result.requestState?.toUpperCase();
}
const unknown = await apps.orders.tools.unknown_output({});
for (const block of unknown.content) if (block.type === "resource") {
  const { uri, mimeType } = block.resource;
  const body: string = "blob" in block.resource ? block.resource.blob : block.resource.text;
}
getContext().principal?.claims.email satisfies string | undefined;
