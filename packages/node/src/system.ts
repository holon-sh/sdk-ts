import { apps, createApps, type Apps, type EndpointBinding } from "../system/index.mjs";

/** The platform's app through which this app reads its own MCP calls, at CONTROL_MCP_URL. Holon gives every app one; nothing is declared. */
export const control: Apps["control"] = apps.control;

/** A client for control at another binding, such as a test's server. */
export function createControl(binding: EndpointBinding): Apps["control"] {
  return createApps({ control: binding }).control;
}
