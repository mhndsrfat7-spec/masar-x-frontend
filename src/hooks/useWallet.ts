"use client";

import { useCallback, useEffect, useState } from "react";
import { walletApi } from "@/lib/api/services";
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

export function useWallet(token: string | null) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [balRes, txRes] = await Promise.all([
        walletApi.balance(token).catch(() => null),
        walletApi.transactions(token).catch(() => null),
      ]);
      setWallet(balRes);
      setTransactions(
        unwrapList<WalletTransaction>(
          txRes as WalletTransaction[] | { data: WalletTransaction[] }
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

  return {
    wallet,
    transactions,
    loading,
    error,
    reload,
    setWallet,
    setTransactions,
  };
}
