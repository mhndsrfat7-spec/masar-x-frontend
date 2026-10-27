"use client";

import { BrandPanel } from "@/components/brand/BrandPanel";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: "login" | "register";
}

/**
 * Two-column auth layout:
 *  - Left (in RTL): BrandPanel with deep-green gradient + illustrations.
 *  - Right: form area with cream background.
 *
 * On mobile: BrandPanel is hidden, only the form shows.
 */
export function AuthLayout({ children, variant = "login" }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-cream-gradient flex">
      {/* Brand side — desktop only */}
      <div className="lg:w-1/2 xl:w-3/5">
        <BrandPanel variant={variant} />
      </div>

      {/* Form side */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="hidden lg:flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>منصة الشحن السعودية الموحدة</span>
          </div>
          <a
            href="#"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            مساعدة؟
          </a>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <LogoMark size={56} />
            </div>
            {children}
          </div>
        </main>

        <footer className="px-8 py-5 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} مسار إكس — جميع الحقوق محفوظة
        </footer>
      </div>
    </div>
  );
}
