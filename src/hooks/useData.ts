"use client";

import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import {
  customersApi,
  invoicesApi,
  notificationsApi,
  publicApi,
} from "@/lib/api/services";
import {
  fetchSwr,
  invalidateSwr,
  isStale,
  readSwr,
  subscribeSwr,
  SwrStaleTime,
} from "@/lib/api/swrCache";
import type {
  Carrier,
  City,
  Customer,
  Invoice,
  NotificationItem,
} from "@/types/api";
import { ApiClientError } from "@/lib/api/client";

function unwrapList<T>(
  r: T[] | { data: T[] } | undefined | null
): T[] {
  if (!r) return [];
  if (Array.isArray(r)) return r;
  if (Array.isArray((r as { data?: T[] }).data))
    return (r as { data: T[] }).data;
  return [];
}

/* ============================================================================
 * Customers (address book) — used for senders + receivers.
 * Cached for SwrStaleTime.LIVE (10s) — list changes when customer added.
 * ==========================================================================*/
const CUSTOMERS_KEY = (token: string) => `customers:${token}`;

export function useCustomers(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to cache for re-render on refresh
  const cacheKey = token ? CUSTOMERS_KEY(token) : "";
  useSyncExternalStore(
    useCallback(
      (cb) => (cacheKey ? subscribeSwr(cacheKey, cb) : () => {}),
      [cacheKey]
    ),
    () => (cacheKey ? readSwr<Customer[]>(cacheKey) : undefined),
    () => undefined
  );

  const list = cacheKey ? readSwr<Customer[]>(cacheKey) ?? [] : [];

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSwr(
        CUSTOMERS_KEY(token),
        async () => {
          const r = await customersApi.list(token);
          return unwrapList<Customer>(r as Customer[] | { data: Customer[] });
        },
        SwrStaleTime.LIVE
      );
      setLoading(false);
      return res;
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "fetch_error");
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // Only fetch if stale or missing
    if (isStale(CUSTOMERS_KEY(token))) {
      void reload();
    }
  }, [token, reload]);

  return {
    list,
    loading,
    error,
    reload,
    /** Call after create/update/delete to refresh the list */
    invalidate: () => token && invalidateSwr(CUSTOMERS_KEY(token)),
  };
}

/* ============================================================================
 * Invoices — list of tax invoices for the merchant.
 * ==========================================================================*/
const INVOICES_KEY = (token: string) => `invoices:${token}`;

export function useInvoices(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = token ? INVOICES_KEY(token) : "";
  useSyncExternalStore(
    useCallback(
      (cb) => (cacheKey ? subscribeSwr(cacheKey, cb) : () => {}),
      [cacheKey]
    ),
    () => (cacheKey ? readSwr<Invoice[]>(cacheKey) : undefined),
    () => undefined
  );

  const list = cacheKey ? readSwr<Invoice[]>(cacheKey) ?? [] : [];

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSwr(
        INVOICES_KEY(token),
        async () => {
          const r = await invoicesApi.list(token);
          return unwrapList<Invoice>(r as Invoice[] | { data: Invoice[] });
        },
        SwrStaleTime.LIVE
      );
      setLoading(false);
      return res;
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "fetch_error");
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (isStale(INVOICES_KEY(token))) {
      void reload();
    }
  }, [token, reload]);

  return {
    list,
    loading,
    error,
    reload,
    invalidate: () => token && invalidateSwr(INVOICES_KEY(token)),
  };
}

/* ============================================================================
 * Notifications — short cache (15s) since users expect freshness here.
 * ==========================================================================*/
const NOTIFS_KEY = (token: string) => `notifications:${token}`;

export function useNotifications(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = token ? NOTIFS_KEY(token) : "";
  useSyncExternalStore(
    useCallback(
      (cb) => (cacheKey ? subscribeSwr(cacheKey, cb) : () => {}),
      [cacheKey]
    ),
    () => (cacheKey ? readSwr<NotificationItem[]>(cacheKey) : undefined),
    () => undefined
  );

  const list = cacheKey ? readSwr<NotificationItem[]>(cacheKey) ?? [] : [];

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSwr(
        NOTIFS_KEY(token),
        async () => {
          const r = await notificationsApi.list(token);
          return unwrapList<NotificationItem>(
            r as NotificationItem[] | { data: NotificationItem[] }
          );
        },
        SwrStaleTime.SHORT
      );
      setLoading(false);
      return res;
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "fetch_error");
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (isStale(NOTIFS_KEY(token))) {
      void reload();
    }
  }, [token, reload]);

  /** Optimistic local mutation: mark items as read without refetch. */
  const markReadOptimistic = useCallback(
    (ids?: string[]) => {
      if (!token) return;
      // Use mutateSwr via dynamic import to avoid cycle.
      import("@/lib/api/swrCache").then(({ mutateSwr }) => {
        const prev = readSwr<NotificationItem[]>(NOTIFS_KEY(token)) ?? [];
        const next = prev.map((n) => {
          if (!ids || ids.includes(n.id)) {
            return { ...n, read: true, isRead: true };
          }
          return n;
        });
        mutateSwr<NotificationItem[]>(NOTIFS_KEY(token), next);
      });
    },
    [token]
  );

  return {
    list,
    loading,
    error,
    reload,
    markReadOptimistic,
    invalidate: () => token && invalidateSwr(NOTIFS_KEY(token)),
  };
}

/* ============================================================================
 * Public data — cities + carriers. No auth required. Long cache (60s)
 * because these rarely change and are requested on every page navigation.
 * ==========================================================================*/
const CITIES_KEY = "public:cities";
const CARRIERS_KEY = "public:carriers";

export function usePublicData() {
  const [loading, setLoading] = useState(false);

  // Subscribe to both cache keys
  useSyncExternalStore(
    useCallback((cb) => subscribeSwr(CITIES_KEY, cb), []),
    () => readSwr<City[]>(CITIES_KEY),
    () => undefined
  );
  useSyncExternalStore(
    useCallback((cb) => subscribeSwr(CARRIERS_KEY, cb), []),
    () => readSwr<Carrier[]>(CARRIERS_KEY),
    () => undefined
  );

  const cities = readSwr<City[]>(CITIES_KEY) ?? [];
  const carriers = readSwr<Carrier[]>(CARRIERS_KEY) ?? [];

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSwr(
          CITIES_KEY,
          async () => {
            const r = await publicApi.cities();
            return unwrapList<City>(r as City[] | { data: City[] });
          },
          SwrStaleTime.LONG
        ),
        fetchSwr(
          CARRIERS_KEY,
          async () => {
            const r = await publicApi.carriersActive();
            return unwrapList<Carrier>(r as Carrier[] | { data: Carrier[] });
          },
          SwrStaleTime.LONG
        ),
      ]);
    } catch {
      /* silent — public data fails are non-fatal */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isStale(CITIES_KEY) || isStale(CARRIERS_KEY)) {
      void reload();
    }
  }, [reload]);

  return { cities, carriers, loading, reload };
}
