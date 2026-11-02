"use client";

import { useEffect, useState, useDeferredValue } from "react";

/**
 * Debounce a fast-changing value (e.g., a search input) so expensive
 * downstream operations (filtering, network calls) don't fire on every keystroke.
 *
 * @param value   The fast-changing input value.
 * @param delayMs Debounce window in ms (default 250).
 * @returns       The debounced value — only updates after `delayMs` of silence.
 */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

/**
 * useDeferredValue-based alternative for React 18+ concurrent rendering.
 * Useful when you want the input to stay responsive while heavy filtering
 * happens at lower priority.
 */
export function useDeferredInput<T>(value: T): T {
  return useDeferredValue(value);
}

/**
 * Simple client-side pagination hook for already-loaded lists.
 * Server-side pagination should use the API's `limit`/`offset` params
 * directly, but for cached in-memory lists this avoids re-rendering
 * thousands of DOM nodes.
 */
export function usePagination<T>(
  items: T[],
  pageSize = 20
): {
  page: number;
  pageSize: number;
  totalPages: number;
  paginated: T[];
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (n: number) => void;
} {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 if list shrinks (e.g., after a filter change)
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const start = (page - 1) * pageSize;
  const paginated = items.slice(start, start + pageSize);

  return {
    page,
    pageSize,
    totalPages,
    paginated,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
    setPage,
  };
}
