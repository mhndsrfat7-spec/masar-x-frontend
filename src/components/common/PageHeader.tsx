"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 mb-3",
        className
      )}
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}

export function BackButton({
  label,
  onClick,
}: {
  label?: string;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowRight className="h-4 w-4 rtl-flip" />
      {label ?? t("common.back")}
    </button>
  );
}
