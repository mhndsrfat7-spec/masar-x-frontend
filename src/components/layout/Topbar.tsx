"use client";

import { Menu, Search, Bell, Plus, Wallet, ChevronLeft } from "lucide-react";
import { useRouterStore } from "@/store/routerStore";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { initials, formatSAR } from "@/lib/format";
import { isDemoMode } from "@/lib/api/services";

interface TopbarProps {
  title: string;
  onToggleSidebar?: () => void;
}

export function Topbar({ title }: TopbarProps) {
  const navigate = useRouterStore((s) => s.navigate);
  const { token, user, logout } = useAuth();
  const { wallet } = useWallet(token);
  const { list: notifs } = useNotifications(token);

  const unread = notifs.filter((n) => !(n.read ?? n.isRead)).length;
  const balance = wallet?.balance ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-3 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-3 sm:px-4 lg:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-0">
          <SheetTitle className="sr-only">القائمة الجانبية</SheetTitle>
          <Sidebar onNavigate={() => {}} />
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <h1 className="text-base font-bold text-foreground lg:text-lg truncate flex-1 lg:flex-none">
        {title}
      </h1>

      {/* Demo badge */}
      {isDemoMode() && (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 hidden sm:inline-flex">
          وضع تجريبي
        </Badge>
      )}

      {/* Spacer */}
      <div className="flex-1 hidden lg:block" />

      {/* Search (desktop) */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن شحنة، عميل، فاتورة…"
            className="pr-9 bg-muted/40 border-transparent focus-visible:border-border"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value) navigate("tracking", { trackingNumber: value });
              }
            }}
          />
        </div>
      </div>

      {/* Wallet balance pill */}
      <button
        type="button"
        onClick={() => navigate("wallet")}
        className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
      >
        <Wallet className="h-3.5 w-3.5 text-primary" />
        <span className="text-muted-foreground hidden md:inline">الرصيد:</span>
        <span className="font-bold text-primary">{formatSAR(balance)}</span>
      </button>

      {/* New shipment */}
      <Button
        size="sm"
        className="hidden sm:inline-flex gap-1.5"
        onClick={() => navigate("create-shipment")}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden lg:inline">شحنة جديدة</span>
      </Button>

      {/* Notifications */}
      <button
        type="button"
        onClick={() => navigate("notifications")}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="الإشعارات"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Avatar */}
      <button
        type="button"
        onClick={() => navigate("profile")}
        className="hidden md:flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 hover:bg-muted transition-colors"
      >
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
            {initials(user?.name)}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-foreground pr-1 max-w-24 truncate">
          {user?.name ?? "حسابي"}
        </span>
      </button>

      {/* Mobile logout */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground hover:text-destructive"
        onClick={logout}
        aria-label="تسجيل الخروج"
      >
        <ChevronLeft className="h-5 w-5 rtl-flip" />
      </Button>
    </header>
  );
}
