// "use client";

// import {
//   Package,
//   Truck,
//   Search,
//   MapPin,
//   Wallet,
//   Grid3x3,
//   ArrowLeft,
//   FileText,
//   Scale,
//   Network,
//   type LucideIcon,
// } from "lucide-react";
// import { useRouterStore, type RouteName } from "@/store/routerStore";
// import { cn } from "@/lib/utils";

// interface QuickAction {
//   route: RouteName;
//   label: string;
//   desc: string;
//   icon: LucideIcon;
//   /** Tailwind classes for the icon tile background + text color */
//   tile: string;
//   iconColor: string;
// }

// // Color palette aligned with the brand reference — each service gets a distinct
// // soft-tinted tile + colored icon, but all stay within the green/teal family
// // with complementary accents (blue/amber/purple) for visual variety.
// const ACTIONS: QuickAction[] = [
//   {
//     route: "shipments",
//     label: "الطرود",
//     desc: "إدارة شحناتك",
//     icon: Package,
//     tile: "bg-emerald-50",
//     iconColor: "text-emerald-600",
//   },
//   {
//     route: "carriers",
//     label: "شركات الشحن",
//     desc: "الناقلون المتاحون",
//     icon: Truck,
//     tile: "bg-blue-50",
//     iconColor: "text-blue-600",
//   },
//   {
//     route: "tracking",
//     label: "تتبّع الشحنات",
//     desc: "حالة الطرد لحظياً",
//     icon: Search,
//     tile: "bg-amber-50",
//     iconColor: "text-amber-600",
//   },
//   {
//     route: "address-book",
//     label: "دفتر العناوين",
//     desc: "المرسلون والمستلمون",
//     icon: MapPin,
//     tile: "bg-purple-50",
//     iconColor: "text-purple-600",
//   },
//   {
//     route: "wallet",
//     label: "المحفظة الرقمية",
//     desc: "الرصيد والمعاملات",
//     icon: Wallet,
//     tile: "bg-teal-50",
//     iconColor: "text-teal-600",
//   },
//   {
//     route: "invoices",
//     label: "الفواتير",
//     desc: "الفواتير والتقارير",
//     icon: FileText,
//     tile: "bg-rose-50",
//     iconColor: "text-rose-600",
//   },
//   {
//     route: "weight-disputes",
//     label: "اعتراضات الوزن",
//     desc: "تظلمات الشحنات",
//     icon: Scale,
//     tile: "bg-indigo-50",
//     iconColor: "text-indigo-600",
//   },
//   {
//     route: "integrations",
//     label: "التكاملات",
//     desc: "مركز التكامل",
//     icon: Network,
//     tile: "bg-cyan-50",
//     iconColor: "text-cyan-600",
//   },
// ];

// export function QuickActions() {
//   const navigate = useRouterStore((s) => s.navigate);
//   return (
//     <section>
//       <div className="flex items-center justify-between mb-3">
//         <h3 className="text-base font-bold text-foreground">الخدمات السريعة</h3>
//         <button
//           type="button"
//           className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
//         >
//           عرض الكل
//         </button>
//       </div>
//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
//         {ACTIONS.map((a) => {
//           const Icon = a.icon;
//           return (
//             <button
//               key={a.route}
//               type="button"
//               onClick={() => navigate(a.route)}
//               className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-right transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/20"
//             >
//               <div
//                 className={cn(
//                   "flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
//                   a.tile
//                 )}
//               >
//                 <Icon className={cn("h-5 w-5", a.iconColor)} />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-semibold text-foreground truncate">{a.label}</p>
//                 <p className="text-[11px] text-muted-foreground truncate">{a.desc}</p>
//               </div>
//             </button>
//           );
//         })}
//       </div>
//     </section>
//   );
// }



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

interface QuickAction {
  route: RouteName;
  label: string;
  desc: string;
  icon: LucideIcon;
  tile: string;
  iconColor: string;
}

const ACTIONS: QuickAction[] = [
  {
    route: "shipments",
    label: "الطرود",
    desc: "إدارة شحناتك",
    icon: Package,
    tile: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    route: "carriers",
    label: "شركات الشحن",
    desc: "الناقلون المتاحون",
    icon: Truck,
    tile: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    route: "tracking",
    label: "تتبّع الشحنات",
    desc: "حالة الطرد لحظياً",
    icon: Search,
    tile: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    route: "address-book",
    label: "دفتر العناوين",
    desc: "المرسلون والمستلمون",
    icon: MapPin,
    tile: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    route: "wallet",
    label: "المحفظة الرقمية",
    desc: "الرصيد والمعاملات",
    icon: Wallet,
    tile: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    route: "invoices",
    label: "الفواتير",
    desc: "الفواتير والتقارير",
    icon: FileText,
    tile: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    route: "weight-disputes",
    label: "اعتراضات الوزن",
    desc: "تظلمات الشحنات",
    icon: Scale,
    tile: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    route: "integrations",
    label: "التكاملات",
    desc: "مركز التكامل",
    icon: Network,
    tile: "bg-cyan-50",
    iconColor: "text-cyan-600",
  },
];

/**
 * QuickActions — 4 compact cards per row on mobile/tablet (`grid-cols-4`),
 * and 4 or 8 on desktop, with reduced padding and centered alignment.
 */
export function QuickActions() {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <section dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm sm:text-base font-bold text-foreground">
          الخدمات السريعة
        </h3>
        <button
          type="button"
          onClick={() => navigate("shipments")}
          className="text-[11px] sm:text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          عرض الكل
        </button>
      </div>
      <div className="grid grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-2.5">
        {ACTIONS.map((a) => {
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