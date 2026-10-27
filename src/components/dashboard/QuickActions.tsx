"use client";

import {
  Package,
  Truck,
  Search,
  MapPin,
  Wallet,
  Grid3x3,
  ArrowLeft,
} from "lucide-react";
import { useRouterStore, type RouteName } from "@/store/routerStore";
import { cn } from "@/lib/utils";

interface QuickAction {
  route: RouteName;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const ACTIONS: QuickAction[] = [
  {
    route: "shipments",
    label: "الطرود",
    desc: "كل شحناتك",
    icon: <Package className="h-6 w-6" />,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    route: "create-shipment",
    label: "شركات الشحن",
    desc: "المتاحة الآن",
    icon: <Truck className="h-6 w-6" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    route: "tracking",
    label: "تتبّع الشحنات",
    desc: "حالة الشحنة",
    icon: <Search className="h-6 w-6" />,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    route: "address-book",
    label: "دفتر العناوين",
    desc: "المرسلون والمستلمون",
    icon: <MapPin className="h-6 w-6" />,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    route: "wallet",
    label: "المحفظة الرقمية",
    desc: "الرصيد والمعاملات",
    icon: <Wallet className="h-6 w-6" />,
    color: "text-green-700",
    bg: "bg-green-50",
  },
  {
    route: "invoices",
    label: "خدمات أخرى",
    desc: "الفواتير والتقارير",
    icon: <Grid3x3 className="h-6 w-6" />,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

export function QuickActions() {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {ACTIONS.map((a) => (
        <button
          key={a.route}
          type="button"
          onClick={() => navigate(a.route)}
          className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-right transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
              a.bg,
              a.color
            )}
          >
            {a.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{a.label}</p>
            <p className="text-[11px] text-muted-foreground">{a.desc}</p>
          </div>
          <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity rtl-flip" />
        </button>
      ))}
    </div>
  );
}
