"use client";

import { BrandPanel } from "@/components/brand/BrandPanel";
import { LogoMark } from "@/components/brand/Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: "login" | "register";
}

/**
 * Two-column auth layout matching the brand reference:
 *  - Right (in RTL, DOM-first): BrandPanel with deep-green gradient + 3D illustration.
 *  - Left (in RTL, DOM-second): form area on cool grey background, with the form
 *    rendered inside a floating white card with soft shadow.
 *
 * On mobile: BrandPanel is hidden, only the form shows.
 */
export function AuthLayout({ children, variant = "login" }: AuthLayoutProps) {
  return (
    // Fixed full-height container: the outer screen and the green brand panel
    // never move; only the inner white card scrolls softly when the form is long.
    <div className="h-screen w-full overflow-hidden bg-cream-gradient flex">
      {/* Brand side — desktop only (appears on the right in RTL); pinned full-height */}
      <div className="hidden lg:block lg:w-1/2 xl:w-3/5 h-screen sticky top-0 overflow-hidden">
        <BrandPanel variant={variant} />
      </div>

      {/* Form side (appears on the left in RTL) — fixed height, no outer scroll */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="hidden lg:flex items-center justify-between px-8 py-5 shrink-0">
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

        {/* Only the centered card area scrolls internally when the form is long. */}
        <main className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 overflow-y-auto">
          <div className="w-full max-w-md max-h-[calc(100vh-7rem)]">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <LogoMark size={56} />
            </div>
            {/* Floating white card containing the form */}
            <div className="rounded-2xl bg-card border border-border shadow-card-hover p-6 sm:p-8">
              {children}
            </div>
          </div>
        </main>

        <footer className="px-8 py-5 text-center text-[11px] text-muted-foreground shrink-0">
          © {new Date().getFullYear()} مسار إكس — جميع الحقوق محفوظة
        </footer>
      </div>
    </div>
  );
}
