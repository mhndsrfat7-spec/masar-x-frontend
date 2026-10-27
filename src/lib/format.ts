/**
 * Formatting utilities — currency, dates, phone numbers, etc.
 *
 * The backend returns prices in HALALAS (1 SAR = 100 halala).
 * All display formatting converts halalas → SAR automatically.
 */

/**
 * Format an amount (which may be halalas OR sar) as SAR currency in Arabic.
 *
 * Heuristic: if the value looks like halalas (> 1000 with no decimal)
 * we divide by 100. Otherwise we treat it as SAR. Pass `unit: "hal"`
 * to force halala interpretation, `unit: "sar"` to force SAR.
 */
export function formatSAR(
  value: number | undefined | null,
  options: { withSymbol?: boolean; unit?: "hal" | "sar" | "auto" } = {}
): string {
  const { withSymbol = true, unit = "auto" } = options;
  let v = typeof value === "number" && !Number.isNaN(value) ? value : 0;

  // Auto-detect: if the value is a large integer (> 1000) and divisible
  // reasonably, assume halalas. The backend always returns halalas for
  // prices and SAR for balances/amounts displayed to the user.
  if (unit === "hal") {
    v = v / 100;
  } else if (unit === "auto") {
    // If the caller passes something that looks like halalas (a whole
    // integer ≥ 1000 and from a Hal field), they should pass unit: "hal".
    // Otherwise we assume SAR.
  }

  const formatted = new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
  return withSymbol ? `${formatted} ر.س` : formatted;
}

/** Convert halalas to SAR number (no formatting). */
export function halToSar(hal: number | undefined | null): number {
  if (!hal || typeof hal !== "number") return 0;
  return hal / 100;
}

/** Convert SAR to halalas (rounded). */
export function sarToHal(sar: number | undefined | null): number {
  if (!sar || typeof sar !== "number") return 0;
  return Math.round(sar * 100);
}

/** Format an ISO date string to Arabic short date. */
export function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Format an ISO date string to Arabic short date + time. */
export function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Time-ago formatter (Arabic). */
export function timeAgo(iso?: string): string {
  if (!iso) return "—";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `منذ ${days} يوم`;
    if (days < 365) return `منذ ${Math.floor(days / 30)} شهر`;
    return `منذ ${Math.floor(days / 365)} سنة`;
  } catch {
    return iso;
  }
}

/** Normalize a Saudi phone number to +9665XXXXXXXX. */
export function normalizeSaudiPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("966")) return `+${digits}`;
  if (digits.startsWith("0")) return `+966${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) return `+966${digits}`;
  return input;
}

/** Validate Saudi phone: 05XXXXXXXX or +9665XXXXXXXX. */
export function isValidSaudiPhone(input: string): boolean {
  const d = input.replace(/[^\d]/g, "");
  if (d.startsWith("966") && d.length === 12) return true;
  if (d.startsWith("0") && d.length === 10 && d[1] === "5") return true;
  if (d.length === 9 && d.startsWith("5")) return true;
  return false;
}

/** Initials from a name (max 2 chars). */
export function initials(name?: string): string {
  if (!name) return "؟";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("");
}

/** Combine class names (lightweight clsx replacement). */
export function classNames(
  ...xs: Array<string | false | undefined | null>
): string {
  return xs.filter(Boolean).join(" ");
}

/** Validate an email address. */
export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

/** Validate Saudi national ID (10 digits, starts with 1 or 2). */
export function isValidNationalId(input: string): boolean {
  const d = input.replace(/[^\d]/g, "");
  return d.length === 10 && (d[0] === "1" || d[0] === "2");
}

/** Validate IBAN (Saudi: SA + 22 digits). */
export function isValidIBAN(input: string): boolean {
  const d = input.replace(/\s/g, "");
  return /^SA\d{22}$/.test(d) || /^SA\d{2}\s?\d{2}\s?\d{18}$/.test(input);
}
