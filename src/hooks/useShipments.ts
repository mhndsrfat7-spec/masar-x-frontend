"use client";

import { useCallback, useEffect, useState } from "react";
import { shipmentsApi } from "@/lib/api/services";
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

export function useShipments(token: string | null) {
  const [list, setList] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<ShipmentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [shipmentsRes, statsRes] = await Promise.all([
        shipmentsApi.list(token).catch(() => []),
        shipmentsApi.stats(token).catch(() => null),
      ]);
      setList(unwrapList<Shipment>(shipmentsRes as Shipment[] | { data: Shipment[] }));
      setStats(statsRes);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "fetch_error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { list, setList, stats, loading, error, reload };
}

export function useShipmentDetails(token: string | null, id?: string) {
  const [item, setItem] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await shipmentsApi.details(token, id);
      setItem(res);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "fetch_error");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { item, setItem, loading, error, reload };
}
