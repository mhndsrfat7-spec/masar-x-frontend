"use client";

import { Globe, Check } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api/services";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  /**
   * - "topbar": Compact circular/pill button for the top header bar (works on both mobile <lg and laptop lg+)
   * - "sidebar": Full-width segmented switcher inside the mobile navigation drawer
   * - "auth": Sleek pill switcher for the login/register header & mobile bar
   * - "settings": Segmented row for ProfilePage quick settings
   */
  variant?: "topbar" | "sidebar" | "auth" | "settings";
  className?: string;
}

export function LanguageSwitcher({
  variant = "topbar",
  className,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation();
  const { token } = useAuth();

  const handleSelectLocale = (nextLocale: "ar" | "en") => {
    if (nextLocale === locale) return;
    setLocale(nextLocale);
    if (token) {
      authApi.updateLocale(token, nextLocale).catch(() => {
        /* non-blocking sync with backend */
      });
    }
  };

  const handleToggle = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    handleSelectLocale(nextLocale);
  };

  if (variant === "sidebar") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-xl border border-sidebar-border bg-muted/40 p-1.5",
          className
        )}
      >
        <div className="flex items-center gap-2 px-2 text-xs font-semibold text-sidebar-foreground">
          <Globe className="h-4 w-4 text-primary shrink-0" />
          <span>{t("common.language")}</span>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-card p-0.5 border border-border/60">
          <button
            type="button"
            onClick={() => handleSelectLocale("ar")}
            className={cn(
              "flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all",
              locale === "ar"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>العربية</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectLocale("en")}
            className={cn(
              "flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all",
              locale === "en"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>EN</span>
          </button>
        </div>
      </div>
    );
  }

  if (variant === "settings") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-lg bg-muted p-1 border border-border/60",
          className
        )}
      >
        <button
          type="button"
          onClick={() => handleSelectLocale("ar")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all",
            locale === "ar"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {locale === "ar" && <Check className="h-3 w-3" />}
          <span>العربية</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectLocale("en")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all",
            locale === "en"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {locale === "en" && <Check className="h-3 w-3" />}
          <span>English</span>
        </button>
      </div>
    );
  }

  if (variant === "auth") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-label={t("common.switchLanguageAria")}
        title={t("common.switchLanguageAria")}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card/90 backdrop-blur-sm px-3 text-xs font-semibold text-foreground shadow-xs hover:border-primary/40 hover:bg-muted transition-all",
          className
        )}
      >
        <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>{locale === "ar" ? "English" : "العربية"}</span>
      </button>
    );
  }

  // Default: "topbar" — responsive for both mobile (<lg) and laptop/desktop (lg+)
  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={t("common.switchLanguageAria")}
      title={t("common.switchLanguageAria")}
      className={cn(
        "relative flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-2.5 sm:px-3 text-xs font-bold text-foreground hover:border-primary/40 hover:bg-muted transition-colors",
        className
      )}
    >
      <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="leading-none">
        {locale === "ar" ? "EN" : "عربي"}
      </span>
    </button>
  );
}
