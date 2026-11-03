"use client";

import { useEffect } from "react";
import { useRouterStore, type RouteName } from "@/store/routerStore";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/i18n";

interface AppRouterProps {
  /** Render the auth routes (login/register). */
  authRoutes: React.ReactNode;
  /** Render the dashboard routes. */
  dashboardRoutes: React.ReactNode;
  /** Fallback while checking initial auth. */
  loadingFallback?: React.ReactNode;
}

/**
 * Top-level router that decides between the auth screen and the dashboard.
 * Routes are managed client-side via the routerStore.
 */
export function AppRouter({ authRoutes, dashboardRoutes }: AppRouterProps) {
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const { t } = useTranslation();

  const isAuthenticated = !!session?.accessToken;

  // Redirect to dashboard if authenticated and on auth routes.
  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated && (route === "login" || route === "register")) {
      navigate("dashboard");
    }
    if (!isAuthenticated && route !== "login" && route !== "register") {
      navigate("login");
    }
  }, [hydrated, isAuthenticated, route, navigate]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-gradient">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm">{t("common.loadingApp")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{authRoutes}</>;
  }

  return <>{dashboardRoutes}</>;
}

export type { RouteName };
