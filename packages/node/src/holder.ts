import { AsyncLocalStorage } from "node:async_hooks";

/** The MCP request serve is answering: its context, which a peer call carries until the request ends. */
export const holder: AsyncLocalStorage<{ token: string; ended: boolean }> = new AsyncLocalStorage();
