import { context, propagation, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from "@opentelemetry/core";

/** What serve registered, to flush before the process exits. */
export interface Telemetry { shutdown(): Promise<void> }

/**
 * Registers what an app needs to continue the traces it is called in, unless the app registered its own: an
 * AsyncLocalStorage context manager and the W3C trace context and baggage propagators always, and a tracer provider
 * exporting over OTLP when OTEL_EXPORTER_OTLP_ENDPOINT is set and OTEL_SDK_DISABLED is not "true". Without a provider,
 * context still flows from each request to the calls it makes, and nothing is exported.
 */
export async function setupTelemetry(env: NodeJS.ProcessEnv = process.env): Promise<Telemetry> {
  const manager = new AsyncLocalStorageContextManager().enable();
  if (!context.setGlobalContextManager(manager)) manager.disable();
  propagation.setGlobalPropagator(new CompositePropagator({ propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()] }));
  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT || env.OTEL_SDK_DISABLED?.trim().toLowerCase() === "true") return { shutdown: async () => {} };
  // The SDK loads only when it will export, so an app without an endpoint never pays for it.
  const [{ BatchSpanProcessor, TracerProvider }, { OTLPTraceExporter }, { defaultResource, detectResources, envDetector }] = await Promise.all([
    import("@opentelemetry/sdk-trace"),
    import("@opentelemetry/exporter-trace-otlp-proto"),
    import("@opentelemetry/resources"),
  ]);
  // OTEL_SERVICE_NAME and OTEL_RESOURCE_ATTRIBUTES, which Holon sets in an app's pod, name the app and its session.
  const resource = defaultResource().merge(detectResources({ detectors: [envDetector] }));
  const provider = new TracerProvider({ resource, spanProcessors: [new BatchSpanProcessor({ exporter: new OTLPTraceExporter() })] });
  if (!trace.setGlobalTracerProvider(provider)) {
    await provider.shutdown();
    return { shutdown: async () => {} };
  }
  return { shutdown: () => provider.shutdown().catch((error: unknown) => console.error(error)) };
}
