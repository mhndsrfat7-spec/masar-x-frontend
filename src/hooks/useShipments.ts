"use client";

import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import { shipmentsApi } from "@/lib/api/services";
import {
  fetchSwr,
  invalidateSwr,
  isStale,
  readSwr,
  subscribeSwr,
  SwrStaleTime,
} from "@/lib/api/swrCache";
import type { Shipment, ShipmentStats } from "@/types/api";
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

const SHIPMENTS_KEY = (token: string) => `shipments:${token}`;
const SHIPMENT_STATS_KEY = (token: string) => `shipment-stats:${token}`;
const SHIPMENT_DETAILS_KEY = (id: string) => `shipment:${id}`;

export function useShipments(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listKey = token ? SHIPMENTS_KEY(token) : "";
  const statsKey = token ? SHIPMENT_STATS_KEY(token) : "";

  useSyncExternalStore(
    useCallback(
      (cb) => (listKey ? subscribeSwr(listKey, cb) : () => {}),
      [listKey]
    ),
    () => (listKey ? readSwr<Shipment[]>(listKey) : undefined),
    () => undefined
  );
  useSyncExternalStore(
    useCallback(
      (cb) => (statsKey ? subscribeSwr(statsKey, cb) : () => {}),
      [statsKey]
    ),
    () => (statsKey ? readSwr<ShipmentStats>(statsKey) : undefined),
    () => undefined
  );

  const list = listKey ? readSwr<Shipment[]>(listKey) ?? [] : [];
  const stats = statsKey ? readSwr<ShipmentStats>(statsKey) ?? null : null;

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch shipments + stats in parallel with dedup
      const [shipmentsRes, statsRes] = await Promise.allSettled([
        fetchSwr(
          SHIPMENTS_KEY(token),
          async () => {
            const r = await shipmentsApi.list(token);
            return unwrapList<Shipment>(r as Shipment[] | { data: Shipment[] });
          },
          SwrStaleTime.LIVE
        ),
        fetchSwr(
          SHIPMENT_STATS_KEY(token),
          async () => {
            return await shipmentsApi.stats(token);
          },
          SwrStaleTime.LIVE
        ),
      ]);
      if (shipmentsRes.status === "rejected") {
        const e = shipmentsRes.reason;
        setError(e instanceof ApiClientError ? e.message : "fetch_error");
      }
      setLoading(false);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "fetch_error");
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (isStale(SHIPMENTS_KEY(token)) || isStale(SHIPMENT_STATS_KEY(token))) {
      void reload();
    }
  }, [token, reload]);

  return {
    list,
    stats,
    loading,
    error,
    reload,
    invalidate: () => {
      if (!token) return;
      invalidateSwr(SHIPMENTS_KEY(token));
      invalidateSwr(SHIPMENT_STATS_KEY(token));
    },
  };
}

export function useShipmentDetails(token: string | null, id?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = id && token ? SHIPMENT_DETAILS_KEY(id) : "";
  useSyncExternalStore(
    useCallback(
      (cb) => (cacheKey ? subscribeSwr(cacheKey, cb) : () => {}),
      [cacheKey]
    ),
    () => (cacheKey ? readSwr<Shipment>(cacheKey) : undefined),
    () => undefined
  );

  const item = cacheKey ? readSwr<Shipment>(cacheKey) ?? null : null;

  const reload = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      await fetchSwr(
        SHIPMENT_DETAILS_KEY(id),
        async () => {
          return await shipmentsApi.details(token, id);
        },
        SwrStaleTime.SHORT
      );
      setLoading(false);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "fetch_error");
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    if (isStale(SHIPMENT_DETAILS_KEY(id))) {
      void reload();
    }
  }, [token, id, reload]);

  return {
    item,
    loading,
    error,
    reload,
    invalidate: () => id && invalidateSwr(SHIPMENT_DETAILS_KEY(id)),
  };
}
