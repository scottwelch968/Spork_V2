/**
 * COSMO 2.0 API Client (Spork-side)
 *
 * Spork must remain a thin presentation layer. All orchestration, routing, tool execution,
 * and durable COSMO state lives behind COSMO 2.0 APIs.
 *
 * - Single integration point for all COSMO calls.
 * - Typed requests/responses aligned with ./types.ts
 * - Standard error envelope: { error: { code, message, details }, requestId? }
 */

import type {
  ActionMappingListResponse,
  ActionMappingResponse,
  ActionMappingUpdateRequest,
  CostMetricsResponse,
  DryRunRequest,
  DryRunResponse,
  ExecuteRequest,
  ExecuteResponse,
  FunctionChainListResponse,
  FunctionChainResponse,
  FunctionChainUpdateRequest,
  HealthResponse,
  IntentListResponse,
  IntentResponse,
  IntentUpdateRequest,
  LogQueryResponse,
  ModelListResponse,
  ModelResponse,
  ModelUpdateRequest,
  QueueStatusResponse,
  ReplayRequest,
  ReplayResponse,
  RoutingConfigResponse,
  RoutingConfigUpdateRequest,
  ErrorResponse,
  JsonValue,
} from "./types";

/** Client configuration */
export interface Cosmo2ClientConfig {
  /** Base URL like: https://api.yourcosmo.com */
  baseUrl: string;
  /** Return a bearer token to send as Authorization header */
  getAuthToken?: () => string | Promise<string>;
  /** Optional default headers (e.g. X-Workspace-Id) */
  defaultHeaders?: Record<string, string>;
  /** Optional fetch implementation (useful for SSR/tests) */
  fetchImpl?: typeof fetch;
}

export class Cosmo2ApiError extends Error {
  public readonly code: string;
  public readonly requestId?: string;
  public readonly details?: JsonValue;

  constructor(message: string, opts: { code: string; requestId?: string; details?: JsonValue }) {
    super(message);
    this.name = "Cosmo2ApiError";
    this.code = opts.code;
    this.requestId = opts.requestId;
    this.details = opts.details;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

function joinUrl(baseUrl: string, path: string): string {
  const b = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

async function parseJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

export class Cosmo2Client {
  private readonly baseUrl: string;
  private readonly getAuthToken?: Cosmo2ClientConfig["getAuthToken"];
  private readonly defaultHeaders?: Record<string, string>;
  private readonly fetchImpl: typeof fetch;

  constructor(config: Cosmo2ClientConfig) {
    this.baseUrl = config.baseUrl;
    this.getAuthToken = config.getAuthToken;
    this.defaultHeaders = config.defaultHeaders;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  /** Core request primitive */
  private async request<T>(
    method: HttpMethod,
    path: string,
    options?: {
      query?: Record<string, unknown>;
      body?: unknown;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    }
  ): Promise<T> {
    const url = joinUrl(this.baseUrl, path) + toQuery(options?.query);
    const token = this.getAuthToken ? await this.getAuthToken() : undefined;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.defaultHeaders ?? {}),
      ...(options?.headers ?? {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await this.fetchImpl(url, {
      method,
      headers,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    });

    if (res.ok) {
      if (res.status === 204) return undefined as unknown as T;
      const data = await parseJsonSafe(res);
      return data as T;
    }

    const err = (await parseJsonSafe(res)) as ErrorResponse | any;
    const code = err?.error?.code ?? `HTTP_${res.status}`;
    const message = err?.error?.message ?? `Request failed with status ${res.status}`;
    const requestId = err?.requestId;
    const details = err?.error?.details;

    throw new Cosmo2ApiError(message, { code, requestId, details });
  }

  // Execution
  execute(req: ExecuteRequest, signal?: AbortSignal): Promise<ExecuteResponse> {
    return this.request("POST", "/v2/execute", { body: req, signal });
  }
  dryRun(req: DryRunRequest, signal?: AbortSignal): Promise<DryRunResponse> {
    return this.request("POST", "/v2/dry-run", { body: req, signal });
  }
  replay(req: ReplayRequest, signal?: AbortSignal): Promise<ReplayResponse> {
    return this.request("POST", "/v2/replay", { body: req, signal });
  }

  // Models
  listModels(params?: { includeDisabled?: boolean }, signal?: AbortSignal): Promise<ModelListResponse> {
    return this.request("GET", "/v2/models", { query: params, signal });
  }
  updateModel(modelId: string, req: ModelUpdateRequest, signal?: AbortSignal): Promise<ModelResponse> {
    return this.request("PUT", `/v2/models/${encodeURIComponent(modelId)}`, { body: req, signal });
  }

  // Routing
  getRoutingConfig(signal?: AbortSignal): Promise<RoutingConfigResponse> {
    return this.request("GET", "/v2/routing/config", { signal });
  }
  updateRoutingConfig(req: RoutingConfigUpdateRequest, signal?: AbortSignal): Promise<RoutingConfigResponse> {
    return this.request("PUT", "/v2/routing/config", { body: req, signal });
  }

  // Intents
  listIntents(params?: { includeInactive?: boolean }, signal?: AbortSignal): Promise<IntentListResponse> {
    return this.request("GET", "/v2/intents", { query: params, signal });
  }
  updateIntent(intentKey: string, req: IntentUpdateRequest, signal?: AbortSignal): Promise<IntentResponse> {
    return this.request("PUT", `/v2/intents/${encodeURIComponent(intentKey)}`, { body: req, signal });
  }

  // Action Mappings
  listActionMappings(params?: { includeInactive?: boolean }, signal?: AbortSignal): Promise<ActionMappingListResponse> {
    return this.request("GET", "/v2/action-mappings", { query: params, signal });
  }
  updateActionMapping(mappingId: string, req: ActionMappingUpdateRequest, signal?: AbortSignal): Promise<ActionMappingResponse> {
    return this.request("PUT", `/v2/action-mappings/${encodeURIComponent(mappingId)}`, { body: req, signal });
  }

  // Function Chains
  listFunctionChains(params?: { includeInactive?: boolean }, signal?: AbortSignal): Promise<FunctionChainListResponse> {
    return this.request("GET", "/v2/function-chains", { query: params, signal });
  }
  updateFunctionChain(chainKey: string, req: FunctionChainUpdateRequest, signal?: AbortSignal): Promise<FunctionChainResponse> {
    return this.request("PUT", `/v2/function-chains/${encodeURIComponent(chainKey)}`, { body: req, signal });
  }

  // Metrics / Ops / Logs
  getCostMetrics(params?: { from?: string; to?: string; groupBy?: "hour" | "day" | "week" | "month" }, signal?: AbortSignal): Promise<CostMetricsResponse> {
    return this.request("GET", "/v2/metrics/costs", { query: params, signal });
  }
  getHealth(signal?: AbortSignal): Promise<HealthResponse> {
    return this.request("GET", "/v2/health", { signal });
  }
  getQueue(signal?: AbortSignal): Promise<QueueStatusResponse> {
    return this.request("GET", "/v2/queue", { signal });
  }
  queryLogs(params?: { requestId?: string; level?: "debug" | "info" | "warn" | "error"; from?: string; to?: string; limit?: number }, signal?: AbortSignal): Promise<LogQueryResponse> {
    return this.request("GET", "/v2/logs", { query: params, signal });
  }
}

export function createCosmo2Client(config: Cosmo2ClientConfig): Cosmo2Client {
  if (!config?.baseUrl) throw new Error("COSMO 2.0 client requires baseUrl");
  return new Cosmo2Client(config);
}
