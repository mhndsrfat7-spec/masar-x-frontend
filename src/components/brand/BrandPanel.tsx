"use client";

import { Logo, LogoMark } from "./Logo";
import {
  ShieldCheck,
  Truck,
  Plane,
  Ship,
  MapPin,
  Globe2,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandPanelProps {
  variant?: "login" | "register";
  className?: string;
}

/**
 * The deep-green brand panel used on the side of auth pages.
 *
 * Visually composed of:
 *  - Logo at top
 *  - Slogan "شحنك أدق، وأعمالك أسرع"
 *  - Decorative world map (dotted) + route curves
 *  - Illustration cluster (box + van for login, globe + vehicles for register)
 *  - 3 value propositions at the bottom
 */
export function BrandPanel({ variant = "login", className }: BrandPanelProps) {
  return (
    <div
      className={cn(
        "relative hidden lg:flex lg:flex-col justify-between overflow-hidden",
        "bg-brand-gradient text-white p-10 xl:p-14 min-h-[640px]",
        className
      )}
    >
      {/* Decorative dotted world map backdrop */}
      <WorldMapBackdrop />

      {/* Top: Logo + slogan */}
      <div className="relative z-10 space-y-8">
        <Logo variant="light" size={48} />

        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight text-balance">
            شحنك أدق، وأعمالك أسرع
          </h2>
          <p className="text-white/80 text-base leading-relaxed">
            منصة واحدة لإدارة شحناتك مع كافة شركات الشحن المحلية والدولية —
            تتبّع لحظي، تسعير فوري، ومحفظة ذكية.
          </p>
        </div>
      </div>

      {/* Middle: floating illustration cluster */}
      <div className="relative z-10 my-8 flex-1 flex items-center">
        <IllustrationCluster variant={variant} />
      </div>

      {/* Bottom: 3 value props */}
      <div className="relative z-10 grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
        <ValueProp
          icon={<ShieldCheck className="h-5 w-5" />}
          title="تعاملات آمنة"
          desc="تشفير كامل"
        />
        <ValueProp
          icon={<Globe2 className="h-5 w-5" />}
          title="شحن محلي ودولي"
          desc="لكل الوجهات"
        />
        <ValueProp
          icon={<Truck className="h-5 w-5" />}
          title="سريع وفعّال"
          desc="توصيل موثوق"
        />
      </div>
    </div>
  );
}

function ValueProp({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-white/60">{desc}</p>
      </div>
    </div>
  );
}

/** Dotted world-map backdrop with route curves + location pins. */
function WorldMapBackdrop() {
  return (
    <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <pattern
            id="brand-dots"
            x="0"
            y="0"
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.2" fill="white" />
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#brand-dots)" />
        {/* Abstract continents */}
        <g fill="white" opacity="0.4">
          <path d="M120 180 Q180 140 240 170 T360 200 L340 260 Q280 290 220 270 T140 250 Z" />
          <path d="M420 140 Q500 110 580 150 T700 180 L680 240 Q600 270 520 250 T440 220 Z" />
          <path d="M180 360 Q260 320 340 360 L320 440 Q240 470 180 440 Z" />
          <path d="M500 340 Q580 300 660 340 L640 420 Q560 450 500 420 Z" />
        </g>
        {/* Route curves */}
        <g
          fill="none"
          stroke="#7FD1A4"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          opacity="0.6"
        >
          <path d="M180 220 Q300 120 460 180 T720 220" />
          <path d="M200 360 Q320 280 480 320 T700 360" />
          <path d="M140 280 Q260 240 380 280" />
        </g>
        {/* Location pins */}
        <g fill="#7FD1A4" opacity="0.8">
          <circle cx="180" cy="220" r="5" />
          <circle cx="460" cy="180" r="5" />
          <circle cx="720" cy="220" r="5" />
          <circle cx="200" cy="360" r="5" />
          <circle cx="480" cy="320" r="5" />
          <circle cx="700" cy="360" r="5" />
        </g>
      </svg>
    </div>
  );
}

function IllustrationCluster({
  variant,
}: {
  variant: "login" | "register";
}) {
  if (variant === "register") {
    return (
      <div className="relative w-full max-w-md mx-auto aspect-square">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-72 w-72">
            {/* Center globe */}
            <div className="absolute inset-8 rounded-full bg-white/5 border border-white/15 flex items-center justify-center">
              <Globe2 className="h-28 w-28 text-white/70 animate-pulse-soft" />
            </div>
            {/* Orbiting transport icons */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 animate-float">
              <Plane className="h-7 w-7 text-white" />
            </div>
            <div
              className="absolute top-1/2 -right-2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 animate-float"
              style={{ animationDelay: "0.5s" }}
            >
              <Truck className="h-7 w-7 text-white" />
            </div>
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 animate-float"
              style={{ animationDelay: "1s" }}
            >
              <Ship className="h-7 w-7 text-white" />
            </div>
            <div
              className="absolute top-1/2 -left-2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 animate-float"
              style={{ animationDelay: "1.5s" }}
            >
              <MapPin className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // login variant — package + van composition (matches brand reference)
  return (
    <div className="relative w-full max-w-md mx-auto h-72">
      {/* Box (kraft paper look) */}
      <div className="absolute bottom-8 right-6 h-32 w-32 rotate-[-6deg] rounded-md bg-[#D4A574] shadow-2xl border border-[#B8865A]">
        <div className="absolute inset-2 border-2 border-dashed border-[#8B5A2B]/40 rounded-sm" />
        {/* Brand tape on top */}
        <div className="absolute top-2 left-2 right-2 h-6 bg-[#0E3B2E] rounded-sm flex items-center justify-center">
          <span className="text-white text-[10px] font-extrabold tracking-widest">
            M • MASAR X
          </span>
        </div>
        {/* Barcode */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5">
          {[0.95, 0.7, 0.85, 0.6].map((w, i) => (
            <div
              key={i}
              className="h-1 bg-[#8B5A2B]/60 rounded-full"
              style={{ width: `${w * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Van */}
      <div className="absolute bottom-12 left-4 h-20 w-56">
        <svg
          viewBox="0 0 240 80"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <linearGradient id="van-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F7A4E" />
              <stop offset="100%" stopColor="#0E3B2E" />
            </linearGradient>
          </defs>
          {/* Van body */}
          <rect x="40" y="14" width="150" height="44" rx="6" fill="url(#van-grad)" />
          <rect x="50" y="22" width="80" height="26" rx="3" fill="rgba(255,255,255,0.18)" />
          {/* Cab */}
          <path d="M190 26 L228 26 L228 58 L190 58 Z" fill="url(#van-grad)" />
          <rect x="198" y="30" width="24" height="16" rx="2" fill="rgba(255,255,255,0.3)" />
          {/* Logo on side */}
          <rect x="140" y="22" width="40" height="20" rx="3" fill="white" />
          <text
            x="160"
            y="36"
            textAnchor="middle"
            fontSize="11"
            fontWeight="800"
            fill="#0E3B2E"
            fontFamily="sans-serif"
          >
            M
          </text>
          {/* Wheels */}
          <circle cx="80" cy="62" r="10" fill="#1A1A1A" />
          <circle cx="80" cy="62" r="4" fill="#444" />
          <circle cx="200" cy="62" r="10" fill="#1A1A1A" />
          <circle cx="200" cy="62" r="4" fill="#444" />
          {/* Shadow */}
          <ellipse cx="120" cy="74" rx="100" ry="4" fill="rgba(0,0,0,0.2)" />
        </svg>
      </div>

      {/* Floating route pin */}
      <div className="absolute top-4 left-12 animate-float">
        <div className="flex flex-col items-center">
          <div className="relative">
            <MapPin
              className="h-10 w-10 text-white drop-shadow-lg"
              fill="rgba(255,255,255,0.2)"
            />
            <div className="absolute inset-0 flex items-center justify-center pt-2">
              <span className="text-[8px] font-bold text-white">M</span>
            </div>
          </div>
          <div className="w-0.5 h-4 bg-white/40" />
        </div>
      </div>

      {/* Route curve */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 288"
        fill="none"
        aria-hidden
      >
        <path
          d="M70 60 Q200 100 320 180"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
          strokeDasharray="4 6"
        />
      </svg>
    </div>
  );
}

/** Compact logo mark used in sidebar, topbar, footer. */
export function LogoCompact({ size = 32 }: { size?: number }) {
  return <LogoMark size={size} />;
}

/** Brand mascot illustration for empty states. */
export function BrandEmptyMascot({
  className,
  icon,
}: {
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-brand-soft",
        className
      )}
    >
      {icon ?? <Package className="h-8 w-8" />}
    </div>
  );
}
