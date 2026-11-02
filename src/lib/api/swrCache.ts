/**
 * In-Memory SWR-style cache for low-churn reference data (cities, carriers)
 * and short-lived lists (notifications, transactions).
 *
 * Goals:
 *  - Zero network noise when navigating between tabs (the header/sidebar
 *    re-renders constantly but should NOT re-fetch cities every time).
 *  - Stale-while-revalidate: show cached data instantly, refresh in
 *    background if older than `staleTime`.
 *  - Per-key dedup: concurrent callers share one in-flight promise.
 *  - Optional AbortController so navigating away cancels the fetch.
 *
 * Not a full replacement for React Query — intentionally minimal, no
 * persistence, no devtools. Keeps bundle size tiny and behavior predictable.
 */

export interface SwrEntry<T> {
  data: T | undefined;
  error: unknown;
  /** ms timestamp of last successful fetch */
  updatedAt: number;
  /** ms timestamp of when data became "stale" (updatedAt + staleTime) */
  expiresAt: number;
  /** Active in-flight promise — dedups concurrent callers */
  promise: Promise<T> | null;
  /** Active abort controller for cancellation */
  controller: AbortController | null;
  /** Subscribers — re-render triggers when data refreshes */
  listeners: Set<() => void>;
}

const DEFAULT_STALE_TIME = 60_000; // 1 minute for stable reference data
const NOTIFICATION_STALE_TIME = 15_000; // 15s for notifications
const DEFAULT_TTL = 5 * 60_000; // keep entry for 5 minutes even if unused

const cache = new Map<string, SwrEntry<unknown>>();

export function getSwrEntry<T>(key: string): SwrEntry<T> | undefined {
  return cache.get(key) as SwrEntry<T> | undefined;
}

function createEntry<T>(): SwrEntry<T> {
  return {
    data: undefined,
    error: undefined,
    updatedAt: 0,
    expiresAt: 0,
    promise: null,
    controller: null,
    listeners: new Set(),
  };
}

/**
 * Subscribe to a cache key. Returns an unsubscribe function.
 * The callback is invoked whenever the key's data changes (refresh).
 */
export function subscribeSwr(key: string, cb: () => void): () => void {
  let entry = cache.get(key);
  if (!entry) {
    entry = createEntry<unknown>();
    cache.set(key, entry);
  }
  entry.listeners.add(cb);
  return () => {
    entry?.listeners.delete(cb);
    // Auto-evict long-unused entries to prevent memory leaks.
    if (entry && entry.listeners.size === 0 && entry.promise === null) {
      const age = Date.now() - entry.updatedAt;
      if (age > DEFAULT_TTL) cache.delete(key);
    }
  };
}

function notifyListeners(key: string): void {
  const entry = cache.get(key);
  if (!entry) return;
  // Clone to avoid mutation-during-iteration issues
  const listeners = Array.from(entry.listeners);
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // listener errors must not break other subscribers
    }
  });
}

/**
 * Read cached data synchronously. Returns undefined if not yet fetched.
 */
export function readSwr<T>(key: string): T | undefined {
  return cache.get(key)?.data as T | undefined;
}

/**
 * Read cached error synchronously.
 */
export function readSwrError<T>(key: string): unknown {
  return cache.get(key)?.error;
}

/**
 * Whether the cached data is stale (older than staleTime) or missing.
 */
export function isStale(key: string): boolean {
  const entry = cache.get(key);
  if (!entry || entry.data === undefined) return true;
  return Date.now() > entry.expiresAt;
}

/**
 * Mutate cached data manually (e.g., after a successful create/mutation).
 * Triggers a re-render for subscribers.
 */
export function mutateSwr<T>(key: string, data: T | ((prev: T | undefined) => T)): void {
  let entry = cache.get(key) as SwrEntry<T> | undefined;
  if (!entry) {
    entry = createEntry<T>();
    cache.set(key, entry as SwrEntry<unknown>);
  }
  const next = typeof data === "function" ? (data as (p: T | undefined) => T)(entry.data) : data;
  entry.data = next;
  entry.error = undefined;
  entry.updatedAt = Date.now();
  entry.expiresAt = Date.now() + DEFAULT_STALE_TIME;
  notifyListeners(key);
}

/**
 * Invalidate a key — next read triggers a re-fetch.
 */
export function invalidateSwr(key: string): void {
  const entry = cache.get(key);
  if (!entry) return;
  entry.expiresAt = 0;
  notifyListeners(key);
}

/**
 * Fetch with dedup + cache + cancellation. Returns a promise that resolves
 * with the (possibly cached) data.
 *
 * @param key          Cache key (e.g., "public:cities")
 * @param fetcher      Function that returns the data; receives the AbortSignal
 * @param staleTime    Ms before data is considered stale (default 60s)
 * @param signal       Optional external signal to cancel the fetch
 */
export function fetchSwr<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  staleTime: number = DEFAULT_STALE_TIME,
  signal?: AbortSignal
): Promise<T> {
  let entry = cache.get(key) as SwrEntry<T> | undefined;
  if (!entry) {
    entry = createEntry<T>();
    cache.set(key, entry as SwrEntry<unknown>);
  }

  // Fresh enough — return cached immediately (still let caller await).
  if (entry.data !== undefined && Date.now() < entry.expiresAt) {
    return Promise.resolve(entry.data);
  }

  // Dedup: if there's already an in-flight fetch, attach to it.
  if (entry.promise) {
    return entry.promise;
  }

  // Cancel any previous in-flight controller (defensive — should be null here).
  if (entry.controller) {
    entry.controller.abort();
  }

  const controller = new AbortController();
  entry.controller = controller;

  // If the caller cancels, abort our internal controller too.
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const promise = fetcher(controller.signal)
    .then((data) => {
      entry!.data = data;
      entry!.error = undefined;
      entry!.updatedAt = Date.now();
      entry!.expiresAt = Date.now() + staleTime;
      notifyListeners(key);
      return data;
    })
    .catch((err) => {
      // Don't overwrite existing good data on error — keep stale data visible.
      entry!.error = err;
      // If we have stale data, resolve with it instead of throwing (SWR behavior).
      if (entry!.data !== undefined) {
        return entry!.data;
      }
      throw err;
    })
    .finally(() => {
      entry!.promise = null;
      entry!.controller = null;
    });

  entry.promise = promise;
  return promise;
}

export const SwrStaleTime = {
  /** 60s — for cities, carriers (rarely change) */
  LONG: DEFAULT_STALE_TIME,
  /** 15s — for notifications */
  SHORT: NOTIFICATION_STALE_TIME,
  /** 10s — for wallet/shipments lists (frequent updates) */
  LIVE: 10_000,
} as const;
