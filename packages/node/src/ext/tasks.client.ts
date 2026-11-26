// Client side of the MCP Tasks extension:
// https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md
import type { Result } from "@modelcontextprotocol/client";
import { declaring, patient, unchecked, type EndpointLink } from "../link.js";
import type { CallOptions, CreateTaskResult, Task } from "../protocol.js";
import type { RuntimeClient } from "../runtime.js";

// https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md#extension-identifier
const declaration = declaring("io.modelcontextprotocol/tasks");

// https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md#polymorphic-results
export const isCreateTaskResult = (value: unknown): value is CreateTaskResult => (value as { resultType?: unknown } | undefined)?.resultType === "task";

export function tasks(link: EndpointLink, callTool: RuntimeClient["callTool"]): Pick<RuntimeClient, "startTask" | "getTask" | "updateTask" | "cancelTask"> {
  const send = <T>(method: string, params: Record<string, unknown>, options?: CallOptions) =>
    link.connected(options, ({ client }) => client.request({ method, params: { ...params, _meta: declaration } }, unchecked<T>(), patient(options)));
  return {
    startTask: (request, options) => callTool({ ...request, _meta: { ...request._meta, ...declaration } }, options),
    getTask: (taskId, options) => send<Task>("tasks/get", { taskId }, options),
    updateTask: (taskId, inputResponses, options) => send<Result>("tasks/update", { taskId, inputResponses }, options),
    cancelTask: (taskId, options) => send<Result>("tasks/cancel", { taskId }, options),
  };
}
