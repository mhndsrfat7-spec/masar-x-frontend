"use client";

import { Logo, LogoMark } from "./Logo";
import {
  ShieldCheck,
  Truck,
  Globe2,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

interface BrandPanelProps {
  variant?: "login" | "register";
  className?: string;
}

/**
 * The deep teal-green brand panel used on the side of auth pages.
 *
 * Visually composed of:
 *  - Logo at top
 *  - Slogan "شحنك أدق، وأعمالك أسرع"
 *  - Decorative world map (dotted) + route curves
 *  - 3D illustration cluster (box + van for login, globe + vehicles for register)
 *  - 3 value propositions at the bottom
 */
export function BrandPanel({ variant = "login", className }: BrandPanelProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "relative hidden lg:flex lg:flex-col justify-between overflow-hidden h-full min-h-screen",
        "bg-brand-gradient auth-brand-panel text-white p-10 xl:p-14",
        className
      )}
    >
      {/* Soft animated brand waves — subtle enough to keep the form-side focus. */}
      <div className="auth-wave-layer" aria-hidden="true">
        <svg className="auth-wave auth-wave-one" viewBox="0 0 900 260" preserveAspectRatio="none">
          <path d="M0 150 C150 70 260 220 430 145 S700 65 900 135" />
        </svg>
        <svg className="auth-wave auth-wave-two" viewBox="0 0 900 260" preserveAspectRatio="none">
          <path d="M0 185 C170 105 300 245 470 175 S720 100 900 165" />
        </svg>
        <svg className="auth-wave auth-wave-three" viewBox="0 0 900 260" preserveAspectRatio="none">
          <path d="M0 115 C180 205 300 55 490 125 S740 215 900 105" />
        </svg>
      </div>

      {/* Soft radial glow accents */}
      <div
        className="absolute top-1/4 -left-20 h-72 w-72 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,.72) 0%, transparent 70%)" }}
        aria-hidden
      />
      <div
        className="absolute bottom-1/4 -right-20 h-72 w-72 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(163,217,165,.58) 0%, transparent 70%)" }}
        aria-hidden
      />

      {/* Top: Logo + slogan */}
      <div className="relative z-10 space-y-8">
        <Logo variant="light" size={44} />

        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight text-balance">
            {t("brand.slogan")}
          </h2>
          <p className="text-white/80 text-base leading-relaxed">
            {t("brand.description")}
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
          icon={ShieldCheck}
          title={t("brand.secureTransactions")}
          desc={t("brand.fullEncryption")}
        />
        <ValueProp
          icon={Globe2}
          title={t("brand.domesticAndInternational")}
          desc={t("brand.allDestinations")}
        />
        <ValueProp
          icon={Truck}
          title={t("brand.fastAndEfficient")}
          desc={t("brand.reliableDelivery")}
        />
      </div>
    </div>
  );
}

function ValueProp({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-white/60">{desc}</p>
      </div>
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
            <div className="absolute inset-8 rounded-full bg-emerald-300/[0.08] border border-emerald-100/20 shadow-[0_0_70px_rgba(16,185,129,0.12)] flex items-center justify-center">
              <Globe2 className="h-28 w-28 text-white/70 animate-pulse-soft" />
            </div>
            {/* Orbiting transport icons */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 p-3 rounded-2xl bg-emerald-300/10 backdrop-blur-sm border border-emerald-100/20 shadow-lg shadow-emerald-950/10 animate-float">
              <Truck className="h-7 w-7 text-white" />
            </div>
            <div
              className="absolute top-1/2 -right-2 -translate-y-1/2 p-3 rounded-2xl bg-emerald-300/10 backdrop-blur-sm border border-emerald-100/20 shadow-lg shadow-emerald-950/10 animate-float"
              style={{ animationDelay: "0.5s" }}
            >
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 p-3 rounded-2xl bg-emerald-300/10 backdrop-blur-sm border border-emerald-100/20 shadow-lg shadow-emerald-950/10 animate-float"
              style={{ animationDelay: "1s" }}
            >
              <Globe2 className="h-7 w-7 text-white" />
            </div>
            <div
              className="absolute top-1/2 -left-2 -translate-y-1/2 p-3 rounded-2xl bg-emerald-300/10 backdrop-blur-sm border border-emerald-100/20 shadow-lg shadow-emerald-950/10 animate-float"
              style={{ animationDelay: "1.5s" }}
            >
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // login variant — isometric 3D package + van composition (matches brand reference)
  return (
    <div className="relative w-full max-w-lg mx-auto h-80">
      {/* Soft glow behind illustration */}
      <div
        className="absolute inset-0 opacity-40 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.4) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      {/* Route curve with dashes + pins */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 500 320"
        fill="none"
        aria-hidden
      >
        {/* Glow route line */}
        <path
          d="M70 80 Q200 60 320 140 T460 220"
          stroke="rgba(16, 185, 129, 0.22)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        {/* Dashed route line */}
        <path
          d="M70 80 Q200 60 320 140 T460 220"
          stroke="#6EE7B7"
          strokeWidth="2.5"
          strokeDasharray="6 8"
          strokeLinecap="round"
          fill="none"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-28"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>
      </svg>

      {/* 3D-style cardboard box (isometric perspective) */}
      <div className="absolute bottom-12 right-8 animate-float" style={{ animationDuration: "4s" }}>
        <Box3D />
      </div>

      {/* Delivery van (isometric) */}
      <div className="absolute bottom-8 left-4 animate-float" style={{ animationDuration: "5s", animationDelay: "0.5s" }}>
        <Van3D />
      </div>

      {/* Floating location pins */}
      <div className="absolute top-6 left-16 animate-float" style={{ animationDuration: "3s" }}>
        <PinMarker />
      </div>
      <div
        className="absolute top-24 right-20 animate-float"
        style={{ animationDuration: "3.5s", animationDelay: "1s" }}
      >
        <PinMarker small />
      </div>
    </div>
  );
}

/** Isometric 3D cardboard box with brand tape + barcode. */
function Box3D() {
  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 140 140"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="box-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A3D9A5" />
          <stop offset="100%" stopColor="#6FCB91" />
        </linearGradient>
        <linearGradient id="box-front" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4FAE7A" />
          <stop offset="100%" stopColor="#1F7A4E" />
        </linearGradient>
        <linearGradient id="box-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#27845C" />
          <stop offset="100%" stopColor="#0D3B3E" />
        </linearGradient>
      </defs>
      {/* Top face (isometric) */}
      <path d="M30 35 L70 20 L110 35 L70 50 Z" fill="url(#box-top)" />
      {/* Front face */}
      <path d="M30 35 L70 50 L70 110 L30 95 Z" fill="url(#box-front)" />
      {/* Side face */}
      <path d="M70 50 L110 35 L110 95 L70 110 Z" fill="url(#box-side)" />
      {/* Brand tape on top */}
      <path d="M30 35 L70 50 L70 55 L30 40 Z" fill="#0D3B3E" opacity="0.95" />
      <path d="M70 50 L110 35 L110 40 L70 55 Z" fill="#082A2C" opacity="0.95" />
      {/* M logo on tape */}
      <text
        x="50"
        y="44"
        textAnchor="middle"
        fontSize="7"
        fontWeight="900"
        fill="#A3D9A5"
        fontFamily="sans-serif"
      >
        M
      </text>
      <text
        x="90"
        y="44"
        textAnchor="middle"
        fontSize="7"
        fontWeight="900"
        fill="#A3D9A5"
        fontFamily="sans-serif"
      >
        X
      </text>
      {/* Barcode on front */}
      <g fill="#0D3B3E" opacity="0.48">
        <rect x="36" y="70" width="1.5" height="20" />
        <rect x="39" y="70" width="0.8" height="20" />
        <rect x="41.5" y="70" width="2" height="20" />
        <rect x="45" y="70" width="1" height="20" />
        <rect x="47.5" y="70" width="1.5" height="20" />
        <rect x="50.5" y="70" width="0.8" height="20" />
        <rect x="52.5" y="70" width="2" height="20" />
        <rect x="56" y="70" width="1" height="20" />
        <rect x="58" y="70" width="1.5" height="20" />
        <rect x="61" y="70" width="0.8" height="20" />
      </g>
      {/* Side label */}
      <rect x="80" y="68" width="22" height="14" rx="1" fill="white" opacity="0.85" />
      <text
        x="91"
        y="78"
        textAnchor="middle"
        fontSize="6"
        fontWeight="800"
        fill="#0D3B3E"
        fontFamily="sans-serif"
      >
        MASAR X
      </text>
      {/* Drop shadow */}
      <ellipse cx="70" cy="118" rx="45" ry="5" fill="rgba(0,0,0,0.25)" />
    </svg>
  );
}

/** Isometric 3D delivery van with brand colors. */
function Van3D() {
  return (
    <svg
      width="200"
      height="100"
      viewBox="0 0 240 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="van-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1F7A4E" />
          <stop offset="100%" stopColor="#0D3B3E" />
        </linearGradient>
        <linearGradient id="van-cab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#1F7A4E" />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="120" cy="100" rx="100" ry="6" fill="rgba(0,0,0,0.2)" />
      {/* Cargo body */}
      <rect x="20" y="30" width="150" height="55" rx="6" fill="url(#van-body)" />
      {/* Side stripe (emerald) */}
      <rect x="20" y="62" width="150" height="6" fill="#10B981" opacity="0.6" />
      {/* Cargo door division */}
      <line x1="80" y1="30" x2="80" y2="85" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
      {/* Cab */}
      <path d="M170 38 L218 38 L224 56 L224 85 L170 85 Z" fill="url(#van-cab)" />
      {/* Windshield */}
      <path d="M178 44 L212 44 L218 58 L178 58 Z" fill="rgba(255,255,255,0.25)" />
      {/* Window detail */}
      <rect x="180" y="60" width="38" height="20" rx="2" fill="rgba(255,255,255,0.15)" />
      {/* Brand logo on side */}
      <rect x="100" y="42" width="50" height="22" rx="3" fill="white" />
      <text
        x="125"
        y="58"
        textAnchor="middle"
        fontSize="14"
        fontWeight="900"
        fill="#0D3B3E"
        fontFamily="sans-serif"
      >
        M
      </text>
      {/* Headlight */}
      <circle cx="220" cy="70" r="2.5" fill="#FCD34D" />
      {/* Wheels */}
      <circle cx="70" cy="88" r="13" fill="#1A1A1A" />
      <circle cx="70" cy="88" r="6" fill="#4B5563" />
      <circle cx="70" cy="88" r="2" fill="#1A1A1A" />
      <circle cx="190" cy="88" r="13" fill="#1A1A1A" />
      <circle cx="190" cy="88" r="6" fill="#4B5563" />
      <circle cx="190" cy="88" r="2" fill="#1A1A1A" />
      {/* Wheel arches */}
      <path d="M55 85 Q70 75 85 85" stroke="rgba(0,0,0,0.3)" strokeWidth="2" fill="none" />
      <path d="M175 85 Q190 75 205 85" stroke="rgba(0,0,0,0.3)" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Floating map pin marker. */
function PinMarker({ small = false }: { small?: boolean }) {
  const size = small ? 28 : 40;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>
      <g filter="url(#pin-shadow)">
        <path
          d="M20 4 C12 4 6 10 6 18 C6 26 20 36 20 36 C20 36 34 26 34 18 C34 10 28 4 20 4 Z"
          fill="#0D3B3E"
        />
        <circle cx="20" cy="18" r="6" fill="#A3D9A5" />
        <circle cx="20" cy="18" r="2.5" fill="#0D3B3E" />
      </g>
    </svg>
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
      {icon ?? <Truck className="h-8 w-8" />}
    </div>
  );
}
