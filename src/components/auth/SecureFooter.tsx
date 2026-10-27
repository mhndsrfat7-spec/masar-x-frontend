"use client";

import { ShieldCheck } from "lucide-react";

/**
 * Footer shown at the bottom of auth forms.
 * Reads "تسجيل دخول آمن ومشفّر" + privacy + terms links.
 */
export function SecureFooter() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span>تسجيل دخول آمن ومشفّر</span>
      </div>
      <p className="text-center text-[10px] leading-relaxed text-muted-foreground/80">
        باستخدامك للخدمة، فإنك توافق على{" "}
        <a href="#" className="underline hover:text-primary">
          شروط الاستخدام
        </a>{" "}
        و{" "}
        <a href="#" className="underline hover:text-primary">
          سياسة الخصوصية
        </a>{" "}
        الخاصة بمسار إكس.
      </p>
    </div>
  );
}
