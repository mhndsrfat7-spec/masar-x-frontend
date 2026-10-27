"use client";

import { useRouterStore } from "@/store/routerStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { ShipmentsPage } from "@/components/pages/ShipmentsPage";
import { ShipmentDetailsPage } from "@/components/pages/ShipmentDetailsPage";
import { CreateShipmentPage } from "@/components/pages/CreateShipmentPage";
import { WalletPage } from "@/components/pages/WalletPage";
import { CustomersPage } from "@/components/pages/CustomersPage";
import { AddressBookPage } from "@/components/pages/AddressBookPage";
import { InvoicesPage } from "@/components/pages/InvoicesPage";
import { TrackingPage } from "@/components/pages/TrackingPage";
import { NotificationsPage } from "@/components/pages/NotificationsPage";
import { ProfilePage } from "@/components/pages/ProfilePage";

/**
 * Renders the currently active dashboard route inside the shared dashboard
 * layout shell (sidebar + topbar + bottom nav).
 */
export function DashboardRoutes() {
  const route = useRouterStore((s) => s.route);

  return (
    <DashboardLayout>
      <RouteRenderer route={route} />
    </DashboardLayout>
  );
}

function RouteRenderer({ route }: { route: string }) {
  switch (route) {
    case "dashboard":
      return <DashboardPage />;
    case "shipments":
      return <ShipmentsPage />;
    case "shipment-details":
      return <ShipmentDetailsPage />;
    case "create-shipment":
      return <CreateShipmentPage />;
    case "wallet":
      return <WalletPage />;
    case "address-book":
      return <AddressBookPage />;
    case "customers":
      return <CustomersPage />;
    case "invoices":
      return <InvoicesPage />;
    case "tracking":
      return <TrackingPage />;
    case "notifications":
      return <NotificationsPage />;
    case "profile":
      return <ProfilePage />;
    default:
      return <DashboardPage />;
  }
}
