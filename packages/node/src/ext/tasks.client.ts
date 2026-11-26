// https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md
import { CLIENT_CAPABILITIES_META_KEY, mergeCapabilities, type Client, type ClientCapabilities, type Result } from "@modelcontextprotocol/client";
import { clientCapabilities, patient, unchecked, type EndpointLink } from "../link.js";
import type { CallMetadata, CallOptions, CreateTaskResult, Task } from "../protocol.js";
import type { RuntimeClient } from "../runtime.js";
import { downloads } from "./files.client.js";

// https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md#extension-identifier
const TASKS = "io.modelcontextprotocol/tasks";

// https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md#capability-negotiation
const declaration = { [CLIENT_CAPABILITIES_META_KEY]: mergeCapabilities(clientCapabilities, { extensions: { [TASKS]: {} } }) };

// https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md#polymorphic-results
export const isCreateTaskResult = ({ _meta }: CallMetadata, value: unknown): value is CreateTaskResult =>
  TASKS in ((_meta?.[CLIENT_CAPABILITIES_META_KEY] as ClientCapabilities | undefined)?.extensions ?? {}) && (value as { resultType?: unknown } | undefined)?.resultType === "task";

export function tasks(link: EndpointLink, callTool: RuntimeClient["callTool"]): Pick<RuntimeClient, "startTask" | "getTask" | "updateTask" | "cancelTask"> {
  const ask = <T>(client: Client, method: string, params: Record<string, unknown>, options?: CallOptions) =>
    client.request({ method, params: { ...params, _meta: declaration } }, unchecked<T>(), patient(options));
  const send = <T>(method: string, params: Record<string, unknown>, options?: CallOptions) => link.connected(options, ({ client }) => ask<T>(client, method, params, options));
  return {
    startTask: (request, options) => callTool({ ...request, _meta: { ...request._meta, ...declaration } }, options),
    getTask: (taskId, options) => link.connected(options, async connection => {
      const task = await ask<Task>(connection.client, "tasks/get", { taskId }, options);
      return task.status === "completed" ? { ...task, result: await downloads(task.result, connection) } : task;
    }),
    updateTask: (taskId, inputResponses, options) => send<Result>("tasks/update", { taskId, inputResponses }, options),
    cancelTask: (taskId, options) => send<Result>("tasks/cancel", { taskId }, options),
  };
}
