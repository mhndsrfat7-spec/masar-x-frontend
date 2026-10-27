import { AppRouter } from "@/lib/router/AppRouter";
import { AuthRoutes } from "@/components/auth/AuthRoutes";
import { DashboardRoutes } from "@/components/pages/DashboardRoutes";

export default function Home() {
  return (
    <AppRouter
      authRoutes={<AuthRoutes />}
      dashboardRoutes={<DashboardRoutes />}
    />
  );
}
