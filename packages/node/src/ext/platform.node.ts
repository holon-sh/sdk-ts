import { createHash } from "node:crypto";
import { lookup } from "node:dns";
import { isIP, type LookupFunction } from "node:net";
import type * as undici from "undici";
import { holder } from "../holder.js";

export async function base64(blob: Blob): Promise<string> {
  return Buffer.from(await blob.arrayBuffer()).toString("base64");
}

export async function sha256(blob: Blob): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of blob.stream()) hash.update(chunk);
  return hash.digest("base64url");
}

let loaded: Promise<{ fetch: typeof undici.fetch; agent: undici.Agent; global: (address: string) => boolean }> | undefined;

export async function fetchGlobal(url: string, init: RequestInit): Promise<Response> {
  const { fetch, agent, global } = await (loaded ??= load());
  const host = new URL(url).hostname.replace(/^\[(.*)\]$/, "$1");
  if (isIP(host) && !global(host)) throw new TypeError("fetch failed", { cause: new Error("the address is not globally reachable") });
  return fetch(url, { ...init, dispatcher: agent } as Parameters<typeof undici.fetch>[1]) as unknown as Promise<Response>;
}

let plain: Promise<{ fetch: typeof undici.fetch; agent: undici.Agent }> | undefined;

// A peer is at the address the platform gave it, often a cluster-local one, which no proxy from the environment reaches.
// Until the MCP request that calls it ends, the call carries that request's context.
export async function fetchPeer(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  const { fetch, agent } = await (plain ??= import("undici").then(({ Agent, fetch }) => ({ fetch, agent: new Agent() })));
  const request = holder.getStore();
  if (request && !request.ended && request.token) {
    const headers = new Headers(init.headers);
    headers.set("x-holon-context", request.token);
    init = { ...init, headers };
  }
  return fetch(input as string | URL, { ...init, dispatcher: agent } as Parameters<typeof undici.fetch>[1]) as unknown as Promise<Response>;
}

async function load() {
  const [{ Agent, fetch }, { default: ipaddr }] = await Promise.all([import("undici"), import("ipaddr.js")]);
  const nat64 = ipaddr.parseCIDR("64:ff9b::/96");
  const global = (address: string) => {
    let ip = ipaddr.process(address);
    if (ip.kind() === "ipv6" && ip.match(nat64)) ip = new ipaddr.IPv4(ip.toByteArray().slice(12));
    return ip.range() === "unicast";
  };
  const resolve: LookupFunction = (hostname, options, callback) => lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "");
    const usable = addresses.filter(({ address }) => global(address));
    const [first] = usable;
    if (!first) return callback(Object.assign(new Error("the host has no globally reachable address"), { code: "ENOTFOUND" }), "");
    if (options.all) callback(null, usable);
    else callback(null, first.address, first.family);
  });
  const agent = new Agent({ connect: { lookup: resolve } });
  return { fetch, agent, global };
}
