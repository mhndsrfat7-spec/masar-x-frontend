// "use client";

// import { Topbar, BottomNav } from "./Sidebar";
// import { useRouterStore, type RouteName } from "@/store/routerStore";
// import { ProfileRestrictionBanner } from "@/components/common/ProfileRestrictionBanner";

// const ROUTE_TITLES: Record<RouteName, string> = {
//   login: "تسجيل الدخول",
//   register: "إنشاء حساب",
//   dashboard: "لوحة التحكم",
//   shipments: "الشحنات",
//   "shipment-details": "تفاصيل الشحنة",
//   "create-shipment": "إنشاء شحنة",
//   wallet: "المحفظة",
//   "address-book": "دفتر العناوين",
//   "address-lookup": "جلب العنوان المختصر",
//   "weight-disputes": "اعتراضات فروقات الوزن",
//   carriers: "شركات الشحن والخدمات",
//   integrations: "مركز التكاملات",
//   customers: "العملاء",
//   invoices: "الفواتير",
//   tracking: "تتبّع الشحنات",
//   notifications: "الإشعارات",
//   profile: "الملف الشخصي",
//   settings: "الإعدادات",
// };

// /**
//  * Dashboard layout — top bar only (NO sidebar).
//  *
//  * Desktop: horizontal top bar with inline nav items.
//  * Mobile: compact top bar + bottom navigation (5 buttons).
//  */
// export function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const route = useRouterStore((s) => s.route);
//   const title = ROUTE_TITLES[route] ?? "مسار إكس";

//   return (
//     <div className="min-h-screen flex flex-col bg-background">
//       <Topbar title={title} />
//       <ProfileRestrictionBanner />

//       <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
//         <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
//           {children}
//         </div>
//       </main>

//       {/* Bottom navigation — mobile only */}
//       <BottomNav />
//     </div>
//   );
// }


"use client";

import { Topbar, BottomNav } from "./Sidebar";
import { useRouterStore, type RouteName } from "@/store/routerStore";
import { ProfileRestrictionBanner } from "@/components/common/ProfileRestrictionBanner";

const ROUTE_TITLES: Record<RouteName, string> = {
  login: "تسجيل الدخول",
  register: "إنشاء حساب",
  dashboard: "لوحة التحكم",
  shipments: "الشحنات",
  "shipment-details": "تفاصيل الشحنة",
  "create-shipment": "إنشاء شحنة",
  wallet: "المحفظة",
  "address-book": "دفتر العناوين",
  "address-lookup": "جلب العنوان المختصر",
  "weight-disputes": "اعتراضات فروقات الوزن",
  carriers: "شركات الشحن والخدمات",
  integrations: "مركز التكاملات",
  customers: "العملاء",
  invoices: "الفواتير",
  tracking: "تتبّع الشحنات",
  notifications: "الإشعارات",
  profile: "الملف الشخصي",
  settings: "الإعدادات",
};

/**
 * Dashboard layout — top bar only (NO sidebar).
 *
 * Desktop: horizontal top bar with centered inline nav items and smart overflow menu.
 * Mobile: compact top bar + bottom navigation (5 buttons).
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const route = useRouterStore((s) => s.route);
  const title = ROUTE_TITLES[route] ?? "مسار إكس";

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Topbar title={title} />
      <ProfileRestrictionBanner />

      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Bottom navigation — mobile only */}
      <BottomNav />
    </div>
  );
}