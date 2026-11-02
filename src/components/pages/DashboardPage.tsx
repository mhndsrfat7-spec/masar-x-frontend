"use client";

import { HeroBanner } from "@/components/dashboard/HeroBanner";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentShipments } from "@/components/dashboard/RecentShipments";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickQuoteWidget } from "@/components/dashboard/QuickQuoteWidget";
import { QuickNav, BrandPromoCard } from "@/components/dashboard/QuickNav";
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
      {/* Hero with integrated wallet balance card + COD pending + eye toggle */}
      <HeroBanner
        balance={wallet?.balance}
        balanceHal={wallet?.balanceHal}
        codPending={wallet?.codPending}
        codPendingHal={wallet?.codPendingHal}
      />

      {/* Capsule-style quick navigation bar — 6 sections */}
      <QuickNav />

      {/* Quick services grid */}
      <QuickActions />

      {/* Stats row — KPI cards */}
      <StatsCards stats={stats} loading={shipmentsLoading} />

      {/* Price comparison widget with delivery scope + "ship with this offer" */}
      <QuickQuoteWidget />

      {/* Recent shipments (wide) + Brand promo card (narrow) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentShipments
            items={list}
            loading={shipmentsLoading}
            error={shipmentsError}
            onRetry={reloadShipments}
          />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <BrandPromoCard />
        </div>
      </div>

      {/* Recent transactions — full-width horizontal strip at the bottom */}
      <RecentTransactions
        items={transactions}
        loading={walletLoading}
      />
    </div>
  );
}
