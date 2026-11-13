// The client side of MCP Events, the draft extension of the Triggers & Events Working Group:
// https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md
import type { Client } from "@modelcontextprotocol/client";
import { patient, sleep, unchecked, untilAborted, type Link } from "../link.js";
import type { CallOptions, EventOccurrence, EventType, Subscription, WatchOptions } from "../protocol.js";
import type { Contract, RuntimeClient } from "../runtime.js";

// A stream that has said nothing for twice the longest heartbeat interval is dead: https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md#lifecycle
const QUIET = 60_000;
type Sent = EventOccurrence & { cursor?: string | null; _meta?: unknown };
type Listed = { events?: EventType[]; nextCursor?: string };
type Polled = { events?: Sent[]; cursor?: string | null; truncated?: boolean; hasMore?: boolean; nextPollMs?: number };
// A server's refusal ends a subscription: a client error, or an answer that the event type is gone, that access was
// lost, or that the request is no longer valid. Anything else is tried again from the cursor.
const refused = (error: any): boolean => error?.status >= 400 && error.status < 500 || error?.data?.status >= 400 && error.data.status < 500 || [-32602, -32023, -32024, -32026].includes(error?.code);

export function events(link: Link, contract: Contract | null, expect: (schema: object, label: string) => (value: unknown) => void): RuntimeClient["ext"]["events"] {
  const { name } = link;
  const connected = <T>(options: CallOptions | undefined, run: (client: Client) => Promise<T>) => link.session(options, (_, connection) => {
    if (!connection) throw new Error(`MCP Events of ${name} require an endpoint binding.`);
    return run(connection.client);
  });
  const list = (options?: CallOptions) => connected(options, async client => {
    const events: EventType[] = [];
    for (let cursor: string | undefined; ;) {
      const page = await client.request({ method: "events/list", params: { ...(cursor && { cursor }) } }, unchecked<Listed>(), patient(options));
      events.push(...page.events ?? []);
      if (!(cursor = page.nextCursor)) return events;
    }
  });
  const watch = async (event: string, args: unknown, onEvent: (event: EventOccurrence) => void | Promise<void>, { signal, onOpen, onGap, maxAgeMs, reconnect = true, ...options }: WatchOptions = {}): Promise<void> => {
    const resolved = link.endpoint(`Subscribing to ${name} ${event}`);
    const offered = (await list(signal && { signal })).find(type => type.name === event)?.delivery;
    if (!offered) throw new Error(`${name} has no event ${event}.`);
    const delivery = options.delivery ?? (["push", "poll"] as const).find(mode => offered.includes(mode));
    // The sketch's NoCompatibleDeliveryMode: none of the modes the server offers is one this client uses.
    if (!delivery || !offered.includes(delivery)) throw Object.assign(new Error(`${name} does not deliver ${event} by ${delivery ?? "poll or push"}.`), { name: "NoCompatibleDeliveryMode" });
    const cancelled = new AbortController();
    const ended = signal ? AbortSignal.any([signal, cancelled.signal]) : cancelled.signal;
    let cursor = options.cursor ?? null;
    const seen = new Set<string>();
    let failure: unknown;
    let delivered = Promise.resolve();
    const observe = (callback: () => void | Promise<void>) => {
      delivered = delivered.then(callback);
      void delivered.catch(error => { failure = error; cancelled.abort(); });
    };
    const subscription: Subscription = { delivery, get cursor() { return cursor; }, cancel: () => cancelled.abort() };
    const reach = (next: string | null | undefined, truncated?: boolean) => {
      cursor = next ?? null;
      if (truncated) onGap?.();
    };
    const expected = contract?.events?.find(type => type.name === event)?.payloadSchema;
    const check = expected && expect(expected, `data of ${name} ${event}`);
    const read = ({ cursor: _, _meta, ...occurrence }: Sent) => {
      if (seen.has(occurrence.eventId)) return;
      seen.add(occurrence.eventId);
      if (seen.size > 1024) seen.delete(seen.values().next().value!);
      check?.(occurrence.data);
      return occurrence;
    };
    const request = { name: event, arguments: args, ...(maxAgeMs !== undefined && { maxAgeMs }) };
    let confirmed = false;
    const confirm = () => { if (!confirmed) { confirmed = true; observe(() => onOpen?.(subscription)); } };
    const poll = async () => {
      while (!ended.aborted) {
        let wait = 1000;
        try {
          const result = await connected({ signal: ended }, client => client.request({ method: "events/poll", params: { ...request, cursor } }, unchecked<Polled>(), patient({ signal: ended })));
          try {
            const initial: EventOccurrence[] = [];
            for (const sent of result.events ?? []) {
              const occurrence = read(sent);
              if (occurrence) {
                if (confirmed) observe(() => onEvent(occurrence));
                else initial.push(occurrence);
              }
            }
            reach(result.cursor, result.truncated);
            confirm();
            for (const occurrence of initial) observe(() => onEvent(occurrence));
          } catch (error) { failure = error; return cancelled.abort(); }
          // A server that asks for a tight loop is not obeyed.
          wait = result.hasMore ? 0 : Math.max(1000, result.nextPollMs ?? 0);
        } catch (error) {
          if (ended.aborted) return;
          if (!confirmed || !reconnect || refused(error)) throw error;
        }
        await sleep(wait, ended);
      }
    };
    const stream = async () => {
      while (!ended.aborted) {
        let wait = 1000;
        const quiet = new AbortController();
        // The MCP client keeps waiting for the answer of a request whose stream has ended, so the end is watched for here.
        // Only the stream's own response is watched: a 2025 server answers its initialization as a stream too.
        const watched: typeof fetch = async (input, init) => {
          const response = await (resolved.fetch ?? fetch)(input, init);
          const streaming = typeof init?.body === "string" && init.body.includes('"method":"events/stream"');
          if (!streaming || !response.body || !response.headers.get("content-type")?.startsWith("text/event-stream")) return response;
          const reader = response.body.getReader();
          const body = new ReadableStream({
            pull: controller => reader.read().then(({ done, value }) => {
              if (!done) return controller.enqueue(value);
              controller.close();
              // The answer, when the stream ended with one, is handled first.
              setTimeout(() => quiet.abort());
            }, error => { controller.error(error); quiet.abort(); }),
            cancel: reason => reader.cancel(reason),
          });
          return new Response(body, response);
        };
        // Each stream has its own connection, so every event notification on it is this subscription's.
        const connection = link.connect({ ...resolved, fetch: watched });
        let timer: ReturnType<typeof setTimeout> | undefined;
        const heard = () => {
          clearTimeout(timer);
          timer = setTimeout(() => quiet.abort(), QUIET);
        };
        try {
          await untilAborted(connection.ready, ended);
          const on = <P>(method: string, handle: (params: P) => void) => connection.client.setNotificationHandler(`notifications/events/${method}`, { params: unchecked<P>() }, params => {
            if (ended.aborted) return;
            heard();
            try { handle(params); } catch (error) { failure = error; cancelled.abort(); }
          });
          on<Pick<Polled, "cursor" | "truncated">>("active", ({ cursor: next, truncated }) => { reach(next, truncated); confirm(); });
          on<Sent>("event", occurrence => {
            if (!confirmed) throw new Error(`${name} sent an event before confirming ${event}.`);
            wait = 0;
            const value = read(occurrence);
            if (value) observe(() => onEvent(value));
            reach(occurrence.cursor);
          });
          on<Pick<Polled, "cursor">>("heartbeat", ({ cursor: next }) => reach(next));
          // The server recovers from an error by itself, and the stream stays open.
          on("error", () => {});
          on<{ error: { code?: number; message?: string; data?: unknown } }>("terminated", ({ error: { message, ...error } }) => { failure = Object.assign(new Error(`${name} ended the subscription to ${event}: ${message}`), error); cancelled.abort(); });
          heard();
          await connection.client.request({ method: "events/stream", params: { ...request, cursor } }, unchecked<unknown>(), { signal: AbortSignal.any([ended, quiet.signal]), timeout: 2 ** 31 - 1 });
        } catch (error) {
          if (!ended.aborted && (!confirmed || !reconnect || refused(error))) throw quiet.signal.aborted ? new Error(`Lost the connection to ${name} for ${event}.`) : error;
        } finally {
          clearTimeout(timer);
          await connection.close();
        }
        await sleep(wait, ended);
      }
    };
    try { await (delivery === "push" ? stream() : poll()); }
    finally { await delivered; }
    if (failure !== undefined) throw failure;
    if (!confirmed) throw ended.reason;
  };
  return Object.freeze({ list, watch });
}
