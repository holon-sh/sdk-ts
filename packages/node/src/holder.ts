import { AsyncLocalStorage } from "node:async_hooks";

/** An MCP request serve is answering. */
export interface Answering {
  token: string;
  ended: boolean;
  /** Set by an event stream: closes it as the server does, with its final frame, so its client opens it again. */
  end?: () => void;
}

/** The MCP request serve is answering: its context, which a peer call carries until the request ends. */
export const holder: AsyncLocalStorage<Answering> = new AsyncLocalStorage();

/** The person actFor makes calls for, which a peer call names in place of any request's context. */
export const acting: AsyncLocalStorage<string> = new AsyncLocalStorage();
