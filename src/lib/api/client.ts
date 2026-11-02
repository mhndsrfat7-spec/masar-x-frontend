import type { ApiError, ApiResult } from "@/types/api";

/**
 * API client for the Masar X backend.
 *
 * Routes everything through the local Next.js proxy at `/api/proxy/...`
 * to avoid CORS issues and keep the backend base URL server-side.
 *
 * All endpoints map 1:1 to the OpenAPI spec at
 * https://YOUR_BACKEND_DOMAIN/api/v1/openapi.json
 *
 * === Performance & High-Concurrency Hardening ===
 *  - Per-request timeout via AbortSignal.timeout(15s) — no frozen UI under load.
 *  - Automatic Idempotency-Key on sensitive POSTs (shipment create, wallet topup,
 *    bank transfer, weight dispute) to prevent double-charges on double-click.
 *  - External AbortSignal merging (caller can still cancel).
 */

const PROXY_PREFIX = "/api/proxy/api/v1";

/** Default request timeout — 15 seconds. Prevents indefinite hangs under load. */
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Paths considered financially sensitive — they get an automatic Idempotency-Key
 * so a double-click (or a retried request after a network blip) cannot create a
 * second shipment / second wallet debit / second dispute.
 *
 * The key is generated once per logical call site and cached on the request body
 * reference, so retries of the SAME fetch reuse the SAME key.
 */
const IDEMPOTENT_PATHS: RegExp[] = [
  /^\/shipments$/, // create shipment (POST)
  /^\/wallet\/topup/, // wallet topup (POST) + bank-transfer (POST)
  /^\/shipments\/[^/]+\/weight-disputes$/, // create weight dispute (POST)
  /^\/weight-disputes\/[^/]+\/attachments$/, // attach evidence (POST)
  /^\/shipments\/[^/]+\/confirm$/, // confirm shipment (POST) — issues invoice
  /^\/shipments\/[^/]+\/cancel$/, // cancel + refund (POST)
];

/** Cache: WeakMap keyed by the request body object → reuse the same key for retries. */
const idempotencyKeyCache = new WeakMap<object, string>();

function getIdempotencyKey(path: string, body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const isPost = IDEMPOTENT_PATHS.some((re) => re.test(path));
  if (!isPost) return undefined;
  let key = idempotencyKeyCache.get(body as object);
  if (!key) {
    // RFC 4122 v4-ish via crypto.randomUUID when available, else fallback.
    key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `idem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    idempotencyKeyCache.set(body as object, key);
  }
  return key;
}

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  raw?: unknown;

  constructor(error: ApiError) {
    super(error.message || `API error ${error.status}`);
    this.name = "ApiClientError";
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
    this.raw = error.raw;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  token?: string | null;
  signal?: AbortSignal;
  rawResponse?: boolean;
  /** Override default timeout (ms). 0 = no timeout. */
  timeoutMs?: number;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${PROXY_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const sp = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Combine an external AbortSignal (from the caller) with an internal timeout
 * signal. The resulting abort fires if EITHER source aborts.
 */
function mergeSignals(
  external?: AbortSignal,
  timeoutMs = DEFAULT_TIMEOUT_MS
): AbortSignal | undefined {
  if (timeoutMs <= 0 && !external) return undefined;
  if (timeoutMs <= 0) return external;
  // AbortSignal.timeout is supported in Node 17+ and all modern browsers.
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!external) return timeoutSignal;
  // If the caller's signal already aborted, propagate immediately.
  if (external.aborted) return external;
  const controller = new AbortController();
  const onAbort = (reason: string) => {
    controller.abort(
      typeof reason === "string" ? new Error(reason) : undefined
    );
  };
  external.addEventListener("abort", () => onAbort("aborted_by_caller"), {
    once: true,
  });
  timeoutSignal.addEventListener("abort", () => onAbort("timeout"), {
    once: true,
  });
  return controller.signal;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (opts.body !== undefined && !(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (opts.token) {
    headers["Authorization"] = `Bearer ${opts.token}`;
  }
  // Auto Idempotency-Key for sensitive POSTs
  const idempotencyKey = getIdempotencyKey(path, opts.body);
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const signal = mergeSignals(opts.signal, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  const init: RequestInit = {
    method: opts.method ?? "GET",
    headers,
    signal,
  };
  if (opts.body !== undefined) {
    if (opts.body instanceof FormData) {
      init.body = opts.body;
    } else {
      init.body = JSON.stringify(opts.body);
    }
  }

  let resp: Response;
  try {
    resp = await fetch(url, init);
  } catch (e) {
    // Distinguish timeout vs caller-abort vs network error for cleaner UX.
    const err = e as Error;
    const aborted = err?.name === "AbortError" || signal?.aborted;
    const reason = signal?.aborted
      ? // If our internal timeout fired, signal.reason is a TimeoutError.
        signal.reason instanceof DOMException && signal.reason.name === "TimeoutError"
        ? "request_timeout"
        : "aborted"
      : "network_error";
    const apiErr: ApiError = {
      status: 0,
      code: reason,
      message: aborted
        ? reason === "request_timeout"
          ? "انتهت مهلة الطلب، يرجى المحاولة مرة أخرى"
          : "تم إلغاء الطلب"
        : err?.message || "network_error",
    };
    throw new ApiClientError(apiErr);
  }

  if (opts.rawResponse) {
    return resp as unknown as T;
  }

  const isJson =
    (resp.headers.get("content-type") || "").includes("application/json");
  let parsed: unknown = null;
  if (isJson) {
    try {
      parsed = await resp.json();
    } catch {
      parsed = null;
    }
  } else {
    try {
      parsed = await resp.text();
    } catch {
      parsed = null;
    }
  }

  if (!resp.ok) {
    const err: ApiError = {
      status: resp.status,
      code:
        (parsed && typeof parsed === "object" && "code" in parsed
          ? String((parsed as Record<string, unknown>).code)
          : undefined) || resp.statusText,
      message:
        (parsed && typeof parsed === "object" && "message" in parsed
          ? String((parsed as Record<string, unknown>).message)
          : undefined) || `HTTP ${resp.status}`,
      raw: parsed,
    };
    throw new ApiClientError(err);
  }

  // Normalize: API sometimes returns { data: ... } or { ok: true, ... }
  if (
    parsed &&
    typeof parsed === "object" &&
    "data" in (parsed as Record<string, unknown>) &&
    Object.keys(parsed as Record<string, unknown>).length <= 3
  ) {
    return (parsed as { data: T }).data;
  }
  return parsed as T;
}

export const apiClient = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
  raw: (path: string, opts?: RequestOptions) =>
    request<Response>(path, { ...opts, rawResponse: true }),
};

export type { ApiResult };
