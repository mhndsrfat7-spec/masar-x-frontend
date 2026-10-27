"use client";

import { HeroBanner } from "@/components/dashboard/HeroBanner";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentShipments } from "@/components/dashboard/RecentShipments";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { useAuth } from "@/hooks/useAuth";
import { useShipments } from "@/hooks/useShipments";
import { useWallet } from "@/hooks/useWallet";

export function DashboardPage() {
  const { token } = useAuth();
  const {
    list,
    stats,
    loading: shipmentsLoading,
    error: shipmentsError,
    reload: reloadShipments,
  } = useShipments(token);
  const { wallet, transactions, loading: walletLoading } = useWallet(token);

  return (
    <div className="space-y-6">
      <HeroBanner
        balance={wallet?.balance}
        balanceHal={wallet?.balanceHal}
      />

      <StatsCards stats={stats} loading={shipmentsLoading} />

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentShipments
            items={list}
            loading={shipmentsLoading}
            error={shipmentsError}
            onRetry={reloadShipments}
          />
        </div>
        <div className="lg:col-span-1">
          <RecentTransactions
            items={transactions}
            loading={walletLoading}
          />
        </div>
      </div>
    </div>
  );
}
