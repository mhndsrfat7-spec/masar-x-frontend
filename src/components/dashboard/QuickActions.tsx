"use client";

import {
  Package,
  Truck,
  Search,
  MapPin,
  Wallet,
  FileText,
  Scale,
  Network,
  type LucideIcon,
} from "lucide-react";
import { useRouterStore, type RouteName } from "@/store/routerStore";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

interface QuickAction {
  route: RouteName;
  label: string;
  desc: string;
  icon: LucideIcon;
  tile: string;
  iconColor: string;
}

/**
 * QuickActions — 4 compact cards per row on mobile/tablet (`grid-cols-4`),
 * and 4 or 8 on desktop, with reduced padding and centered alignment.
 */
export function QuickActions() {
  const navigate = useRouterStore((s) => s.navigate);
  const { t, dir } = useTranslation();

  const actions: QuickAction[] = [
    {
      route: "shipments",
      label: t("dashboard.quickActions.parcels"),
      desc: t("dashboard.quickActions.parcelsDesc"),
      icon: Package,
      tile: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      route: "carriers",
      label: t("dashboard.quickActions.carriers"),
      desc: t("dashboard.quickActions.carriersDesc"),
      icon: Truck,
      tile: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      route: "tracking",
      label: t("dashboard.quickActions.tracking"),
      desc: t("dashboard.quickActions.trackingDesc"),
      icon: Search,
      tile: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      route: "address-book",
      label: t("dashboard.quickActions.addressBook"),
      desc: t("dashboard.quickActions.addressBookDesc"),
      icon: MapPin,
      tile: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      route: "wallet",
      label: t("dashboard.quickActions.digitalWallet"),
      desc: t("dashboard.quickActions.digitalWalletDesc"),
      icon: Wallet,
      tile: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      route: "invoices",
      label: t("dashboard.quickActions.invoices"),
      desc: t("dashboard.quickActions.invoicesDesc"),
      icon: FileText,
      tile: "bg-rose-50",
      iconColor: "text-rose-600",
    },
    {
      route: "weight-disputes",
      label: t("dashboard.quickActions.weightDisputes"),
      desc: t("dashboard.quickActions.weightDisputesDesc"),
      icon: Scale,
      tile: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      route: "integrations",
      label: t("dashboard.quickActions.integrations"),
      desc: t("dashboard.quickActions.integrationsDesc"),
      icon: Network,
      tile: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
  ];

  return (
    <section dir={dir}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm sm:text-base font-bold text-foreground">
          {t("dashboard.quickActions.title")}
        </h3>
        <button
          type="button"
          onClick={() => navigate("shipments")}
          className="text-[11px] sm:text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          {t("common.viewAll")}
        </button>
      </div>
      <div className="grid grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-2.5">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.route}
              type="button"
              onClick={() => navigate(a.route)}
              className="group flex flex-col items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-border bg-card p-2 sm:p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/20"
            >
              <div
                className={cn(
                  "flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                  a.tile
                )}
              >
                <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", a.iconColor)} />
              </div>
              <div className="w-full min-w-0">
                <p className="text-[11px] sm:text-xs font-semibold text-foreground truncate">
                  {a.label}
                </p>
                <p className="hidden sm:block text-[10px] text-muted-foreground truncate mt-0.5">
                  {a.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}