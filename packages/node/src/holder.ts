import { AsyncLocalStorage } from "node:async_hooks";

/**
 * The MCP request serve is answering: its context, which a peer call carries until the request ends. An event stream
 * sets end, which closes the stream as the server does: it sends its final frame, and its client opens it again.
 */
export const holder: AsyncLocalStorage<{ token: string; ended: boolean; end?: () => void }> = new AsyncLocalStorage();
