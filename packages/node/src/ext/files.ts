/** Identifier of the MCP files extension (draft), the key under which a client and a server declare it in their capabilities. */
export const EXTENSION = "io.modelcontextprotocol/files";

/** A file a tool returned for the caller to fetch. Its fields come from the server and are untrusted. */
export interface Download {
  readonly name?: string;
  readonly mimeType: string;
  /** Size in bytes. */
  readonly size: number;
  /** SHA-256 of the file, base64url without padding. */
  readonly digest?: { algorithm: "sha-256"; value: string };
  /** RFC 3339 time after which the file can no longer be fetched. */
  readonly expiresAt?: string;
  /** Fetch the file. Rejects, keeping no bytes, when it has expired, its target breaks the extension's rules, or the bytes do not match size or digest. */
  blob(options?: { signal?: AbortSignal }): Promise<Blob>;
}
