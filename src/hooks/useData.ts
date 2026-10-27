"use client";

import { useCallback, useEffect, useState } from "react";
import { customersApi, invoicesApi, notificationsApi } from "@/lib/api/services";
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

/** Customers (address book) — used for senders + receivers. */
export function useCustomers(token: string | null) {
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await customersApi.list(token);
      setList(unwrapList<Customer>(res as Customer[] | { data: Customer[] }));
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "fetch_error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { list, loading, error, reload };
}

export function useInvoices(token: string | null) {
  const [list, setList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await invoicesApi.list(token);
      setList(unwrapList<Invoice>(res as Invoice[] | { data: Invoice[] }));
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "fetch_error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { list, loading, error, reload };
}

export function useNotifications(token: string | null) {
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.list(token);
      setList(
        unwrapList<NotificationItem>(
          res as NotificationItem[] | { data: NotificationItem[] }
        )
      );
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "fetch_error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { list, loading, error, reload, setList };
}

/** Public data — cities + carriers (no auth required). */
export function usePublicData() {
  const [cities, setCities] = useState<City[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [citiesRes, carriersRes] = await Promise.all([
        import("@/lib/api/services").then((m) => m.publicApi.cities()),
        import("@/lib/api/services").then((m) => m.publicApi.carriersActive()),
      ]);
      const c = unwrapList<City>(citiesRes as City[] | { data: City[] });
      const cr = unwrapList<Carrier>(carriersRes as Carrier[] | { data: Carrier[] });
      setCities(c);
      setCarriers(cr);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { cities, carriers, loading, reload };
}
