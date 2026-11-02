"use client";

import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import { walletApi } from "@/lib/api/services";
import {
  fetchSwr,
  invalidateSwr,
  isStale,
  readSwr,
  subscribeSwr,
  SwrStaleTime,
} from "@/lib/api/swrCache";
import type { Wallet, WalletTransaction } from "@/types/api";
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

const WALLET_KEY = (token: string) => `wallet:${token}`;
const WALLET_TX_KEY = (token: string) => `wallet-tx:${token}`;

export function useWallet(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletKey = token ? WALLET_KEY(token) : "";
  const txKey = token ? WALLET_TX_KEY(token) : "";

  useSyncExternalStore(
    useCallback(
      (cb) => (walletKey ? subscribeSwr(walletKey, cb) : () => {}),
      [walletKey]
    ),
    () => (walletKey ? readSwr<Wallet>(walletKey) : undefined),
    () => undefined
  );
  useSyncExternalStore(
    useCallback(
      (cb) => (txKey ? subscribeSwr(txKey, cb) : () => {}),
      [txKey]
    ),
    () => (txKey ? readSwr<WalletTransaction[]>(txKey) : undefined),
    () => undefined
  );

  const wallet = walletKey ? readSwr<Wallet>(walletKey) ?? null : null;
  const transactions = txKey ? readSwr<WalletTransaction[]>(txKey) ?? [] : [];

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.allSettled([
        fetchSwr(
          WALLET_KEY(token),
          async () => {
            return await walletApi.balance(token);
          },
          SwrStaleTime.LIVE
        ),
        fetchSwr(
          WALLET_TX_KEY(token),
          async () => {
            const r = await walletApi.transactions(token);
            return unwrapList<WalletTransaction>(
              r as WalletTransaction[] | { data: WalletTransaction[] }
            );
          },
          SwrStaleTime.LIVE
        ),
      ]);
      setLoading(false);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "fetch_error");
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (isStale(WALLET_KEY(token)) || isStale(WALLET_TX_KEY(token))) {
      void reload();
    }
  }, [token, reload]);

  return {
    wallet,
    transactions,
    loading,
    error,
    reload,
    invalidate: () => {
      if (!token) return;
      invalidateSwr(WALLET_KEY(token));
      invalidateSwr(WALLET_TX_KEY(token));
    },
  };
}
