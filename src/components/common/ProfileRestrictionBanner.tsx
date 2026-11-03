"use client";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouterStore } from "@/store/routerStore";
import { useAuthStore } from "@/store/authStore";
import { isProfileRestricted } from "@/lib/profileCompletion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";

/**
 * Restricted-browsing banner — shown at the top of the dashboard when the user
 * skipped profile completion at registration (or their profile is missing the
 * required name/email/store fields). Lets them browse, but blocks shipments
 * and wallet operations (enforced in those pages) until they complete it.
 */
export function ProfileRestrictionBanner() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const { t } = useTranslation();

  // Only show when authenticated and restricted.
  if (!session?.accessToken) return null;
  if (!isProfileRestricted(user)) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-200/60 text-amber-700 mt-0.5">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              {t("restriction.bannerText")}
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 shrink-0 bg-amber-600 text-white hover:bg-amber-700"
            onClick={() => navigate("profile")}
          >
            {t("restriction.completeDataNow")}
            <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
          </Button>
        </div>
      </div>
    </div>
  );
}
