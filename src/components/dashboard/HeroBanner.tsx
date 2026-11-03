"use client";

import {
  Truck,
  Plus,
  MapPin,
  ArrowLeft,
  Wallet,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouterStore } from "@/store/routerStore";
import { formatSAR, halToSar } from "@/lib/format";
import { useTranslation } from "@/i18n";

export function HeroBanner({
  balance,
  balanceHal,
  codPending,
  codPendingHal,
}: {
  balance?: number;
  balanceHal?: number;
  codPending?: number;
  codPendingHal?: number;
}) {
  const navigate = useRouterStore((s) => s.navigate);
  const [showBalance, setShowBalance] = useState(true);
  const { t, dir } = useTranslation();

  const displayBalance =
    balanceHal !== undefined ? halToSar(balanceHal) : (balance ?? 0);

  const displayCodPending =
    codPendingHal !== undefined
      ? halToSar(codPendingHal)
      : (codPending ?? 0);

  return (
    <section
      dir={dir}
      className="relative isolate overflow-hidden rounded-[22px] border border-white/10 text-white shadow-[0_16px_40px_-20px_rgba(3,30,38,0.55)]"
      style={{
        background:
          "linear-gradient(118deg, #082A2C 0%, #0D3B3E 54%, #1F7A4E 100%)",
      }}
    >
      {/* Premium background lighting */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 85% 10%, rgba(16,185,129,0.22), transparent 38%), radial-gradient(ellipse at 5% 95%, rgba(163,217,165,0.14), transparent 38%)",
        }}
      />

      {/* Decorative circles */}
      <div
        className="pointer-events-none absolute -left-20 -top-28 -z-10 h-64 w-64 rounded-full border border-white/[0.07]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-10 -top-16 -z-10 h-44 w-44 rounded-full border border-white/[0.06]"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 grid grid-cols-1 items-center gap-3 px-3 py-3 sm:gap-5 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] lg:gap-7 lg:px-6 lg:py-5">
        {/* Intro and Actions */}
        <div className="flex min-w-0 flex-col items-start gap-1.5 sm:gap-2">
          <div className="inline-flex h-6 items-center gap-1.5 rounded-full border border-emerald-200/20 bg-white/[0.08] px-2.5 text-[9px] font-semibold text-emerald-50 backdrop-blur-md sm:h-7 sm:px-3 sm:text-[11px]">
            <MapPin className="h-3.5 w-3.5 text-emerald-300" />
            {t("dashboard.hero.badge")}
          </div>

          <h2 className="text-[18px] font-extrabold leading-tight tracking-tight sm:text-2xl lg:text-[30px]">
            {t("dashboard.hero.title")}
          </h2>

          <p className="max-w-lg line-clamp-2 text-[10px] leading-5 text-white/70 sm:line-clamp-none sm:text-xs sm:leading-6 lg:text-[13px]">
            {t("dashboard.hero.description")}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              size="sm"
              className="h-8 sm:h-9 gap-1.5 rounded-full border-0 bg-emerald-400 px-4 text-[11px] font-bold text-[#082A2C] shadow-md transition-all hover:bg-emerald-300 hover:shadow-lg sm:text-xs"
              onClick={() => navigate("create-shipment")}
            >
              <Plus className="h-4 w-4" />
              {t("dashboard.hero.startShipmentNow")}
              <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 sm:h-9 gap-1.5 rounded-full border-white/20 bg-white/[0.06] px-4 text-[11px] font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/[0.13] hover:text-white sm:text-xs"
              onClick={() => navigate("tracking")}
            >
              <Truck className="h-4 w-4" />
              {t("dashboard.hero.trackShipment")}
            </Button>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="w-full lg:justify-self-end lg:max-w-[310px]">
          <div className="rounded-2xl border border-white/[0.16] bg-white/[0.09] p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.10)] backdrop-blur-xl sm:p-4">
            {/* Wallet Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.12]">
                  <Wallet className="h-4 w-4 text-emerald-200" />
                </div>

                <div>
                  <p className="text-xs font-bold text-white">
                    {t("dashboard.hero.walletTitle")}
                  </p>
                  <p className="text-[10px] text-white/55">
                    {t("dashboard.hero.availableBalance")}
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1 text-[9px] font-semibold tracking-wider text-emerald-100">
                {t("common.sarCode")}
              </span>
            </div>

            {/* Balance */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <p
                    dir="ltr"
                    className="text-[25px] font-extrabold tracking-tight tabular-nums sm:text-[29px]"
                  >
                    {showBalance
                      ? formatSAR(displayBalance, { withSymbol: false })
                      : "••••••"}
                  </p>

                  {showBalance && (
                    <span className="text-[11px] font-semibold text-white/65">
                      {t("common.sar")}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBalance((value) => !value)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/70 transition-colors hover:bg-white/[0.16] hover:text-white"
                aria-label={
                  showBalance
                    ? t("dashboard.hero.hideBalance")
                    : t("dashboard.hero.showBalance")
                }
                title={
                  showBalance
                    ? t("dashboard.hero.hideBalance")
                    : t("dashboard.hero.showBalance")
                }
              >
                {showBalance ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Pending COD */}
            {displayCodPending > 0 && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-white/[0.09] bg-black/[0.12] px-3 py-2">
                <span className="text-[10px] font-medium text-white/65">
                  {t("dashboard.hero.pendingCollection")}
                </span>

                <span
                  dir="ltr"
                  className="text-xs font-bold tabular-nums text-amber-300"
                >
                  {showBalance
                    ? `${formatSAR(displayCodPending, {
                        withSymbol: false,
                      })} ${t("common.sar")}`
                    : "••••"}
                </span>
              </div>
            )}

            {/* Wallet Action */}
            <Button
              size="sm"
              className="mt-3 h-8 sm:h-9 w-full gap-1.5 rounded-xl bg-emerald-500 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-400"
              onClick={() => navigate("wallet")}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("dashboard.hero.topupWallet")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
