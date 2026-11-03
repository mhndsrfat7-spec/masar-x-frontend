"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslation } from "@/i18n";

/**
 * Footer shown at the bottom of auth forms.
 * Reads "تسجيل دخول آمن ومشفّر" + privacy + terms links.
 */
export function SecureFooter() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span>{t("auth.secureLoginFooter")}</span>
      </div>
      <p className="text-center text-[10px] leading-relaxed text-muted-foreground/80">
        {t("auth.termsAgreementPrefix")}{" "}
        <a href="#" className="underline hover:text-primary">
          {t("auth.termsOfUse")}
        </a>{" "}
        {t("auth.and")}{" "}
        <a href="#" className="underline hover:text-primary">
          {t("auth.privacyPolicy")}
        </a>{" "}
        {t("auth.termsAgreementSuffix")}
      </p>
    </div>
  );
}
