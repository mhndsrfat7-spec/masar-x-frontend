"use client";

import { Bell, CheckCheck, BellOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useData";
import { notificationsApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { PageHeader } from "@/components/common/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/common/StateViews";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";

export function NotificationsPage() {
  const { token } = useAuth();
  const { list, loading, error, reload, markReadOptimistic } = useNotifications(token);

  const unread = list.filter((n) => !(n.read ?? n.isRead));

  const markAllRead = async () => {
    if (!token || unread.length === 0) return;
    try {
      await notificationsApi.markRead(token, unread.map((n) => n.id));
      markReadOptimistic(unread.map((n) => n.id));
      toast.success("تم تعليم جميع الإشعارات كمقروءة");
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "تعذّر تحديث الإشعارات"
      );
    }
  };

  const markOneRead = async (id: string) => {
    if (!token) return;
    try {
      await notificationsApi.markRead(token, [id]);
      markReadOptimistic([id]);
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "تعذّر تحديث الإشعار"
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإشعارات"
        description={`${unread.length} إشعار غير مقروء من أصل ${list.length}.`}
        action={
          unread.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={markAllRead}
            >
              <CheckCheck className="h-4 w-4" />
              تعليم الكل كمقروء
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState message="جارٍ تحميل الإشعارات…" className="py-16" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} className="py-16" />
          ) : list.length === 0 ? (
            <EmptyState
              title="لا توجد إشعارات"
              description="ستظهر هنا تنبيهات الشحنات والمعاملات المهمة."
              icon={BellOff}
              className="py-16"
            />
          ) : (
            <ul className="divide-y divide-border">
              {list.map((n) => {
                const isUnread = !(n.read ?? n.isRead);
                return (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors ${
                      isUnread ? "bg-primary/5" : ""
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isUnread
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {n.title ?? n.titleAr ?? "إشعار"}
                        </p>
                        {isUnread && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-primary/10 text-primary"
                          >
                            جديد
                          </Badge>
                        )}
                      </div>
                      {(n.body ?? n.bodyAr) && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body ?? n.bodyAr}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </span>
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => markOneRead(n.id)}
                            className="text-xs text-primary hover:underline"
                          >
                            تعليم كمقروء
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
