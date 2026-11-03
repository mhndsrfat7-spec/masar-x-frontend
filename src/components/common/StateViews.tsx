"use client";

import { Loader2, AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

export function LoadingState({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">{message ?? t("common.loading")}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm">
        {message ?? t("common.unexpectedError")}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 text-center",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">
          {title ?? t("common.noData")}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {description ?? t("common.noMatchingItems")}
        </p>
      </div>
      {action}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-xl h-24", className)} />;
}
