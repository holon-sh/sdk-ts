import { createHash } from "node:crypto";
import { lookup } from "node:dns";
import { isIP } from "node:net";

export const base64 = async blob => Buffer.from(await blob.arrayBuffer()).toString("base64");

export async function sha256(blob) {
  const hash = createHash("sha256");
  for await (const chunk of blob.stream()) hash.update(chunk);
  return hash.digest("base64url");
}

let loaded;
export async function fetchGlobal(url, init) {
  const { fetch, agent, global } = await (loaded ??= load());
  const host = new URL(url).hostname.replace(/^\[(.*)\]$/, "$1");
  if (isIP(host) && !global(host)) throw new TypeError("fetch failed", { cause: new Error("the address is not globally reachable") });
  return fetch(url, { ...init, dispatcher: agent });
}

async function load() {
  const [{ Agent, fetch }, { default: ipaddr }] = await Promise.all([import("undici"), import("ipaddr.js")]);
  const nat64 = ipaddr.parseCIDR("64:ff9b::/96");
  const global = address => {
    let ip = ipaddr.process(address);
    if (ip.kind() === "ipv6" && ip.match(nat64)) ip = new ipaddr.IPv4(ip.toByteArray().slice(12));
    return ip.range() === "unicast";
  };
  const agent = new Agent({ connect: { lookup: (hostname, options, callback) => lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error);
    const usable = addresses.filter(({ address }) => global(address));
    if (!usable.length) return callback(Object.assign(new Error("the host has no globally reachable address"), { code: "ENOTFOUND" }));
    if (options.all) callback(null, usable);
    else callback(null, usable[0].address, usable[0].family);
  }) } });
  return { fetch, agent, global };
}
