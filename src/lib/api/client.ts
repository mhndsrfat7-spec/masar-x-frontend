import type { ApiError, ApiResult } from "@/types/api";

/**
 * API client for the Masar X backend.
 *
 * Routes everything through the local Next.js proxy at `/api/proxy/...`
 * to avoid CORS issues and keep the backend base URL server-side.
 *
 * All endpoints map 1:1 to the OpenAPI spec at
 * http://185.211.5.19:8081/api/v1/openapi.json
 */

const PROXY_PREFIX = "/api/proxy/api/v1";

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

  const init: RequestInit = {
    method: opts.method ?? "GET",
    headers,
    signal: opts.signal,
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
    const msg = e instanceof Error ? e.message : "network_error";
    const err: ApiError = {
      status: 0,
      code: "network_error",
      message: msg,
    };
    throw new ApiClientError(err);
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
