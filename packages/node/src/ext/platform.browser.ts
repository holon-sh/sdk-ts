export async function base64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x8000) binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  return btoa(binary);
}

export async function sha256(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return (await base64(new Blob([digest]))).replace(/=+$/, "").replaceAll("+", "-").replaceAll("/", "_");
}

export function fetchGlobal(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, init);
}

export function fetchPeer(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  return fetch(input, init);
}
