"use client";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouterStore } from "@/store/routerStore";
import { useAuthStore } from "@/store/authStore";
import { isProfileRestricted } from "@/lib/profileCompletion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Inline restriction alert card — drop at the top of sensitive pages
 * (create shipment, wallet) when the user is in restricted browsing mode.
 *
 * Returns null when the account is unrestricted, so it is safe to mount
 * unconditionally.
 */
export function ProfileRestrictionAlert({ className }: { className?: string }) {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);

  if (!session?.accessToken) return null;
  if (!isProfileRestricted(user)) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-200/60 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            هذه العملية مقيّدة حتى تُكمل بيانات ملفك الشخصي
          </p>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            لا يمكن إنشاء شحنات أو إجراء عمليات مالية في وضع التصفح المقيّد.
            أكمل الاسم والبريد الإلكتروني (وبيانات المتجر للتاجر) من الملف الشخصي لتفعيل هذه الصلاحيات فوراً.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        className="gap-1.5 shrink-0 bg-amber-600 text-white hover:bg-amber-700"
        onClick={() => navigate("profile")}
      >
        إكمال البيانات
        <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
      </Button>
    </div>
  );
}

/** Helper: returns true if the current session is restricted (use in handlers). */
export function useIsProfileRestricted(): boolean {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  if (!session?.accessToken) return false;
  return isProfileRestricted(user);
}
