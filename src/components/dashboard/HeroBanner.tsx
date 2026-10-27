"use client";

import { Truck, Plane, Ship, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouterStore } from "@/store/routerStore";
import { formatSAR, halToSar } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Hero banner — deep-green gradient with dotted world map + balance card.
 * Matches the brand reference: "شحن أسهل.. يصل أبعد".
 */
export function HeroBanner({
  balance,
  balanceHal,
}: {
  balance?: number;
  balanceHal?: number;
}) {
  const navigate = useRouterStore((s) => s.navigate);

  // Prefer balanceHal (from real API) → fall back to balance.
  const displayBalance = balanceHal ? halToSar(balanceHal) : (balance ?? 0);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-gradient text-white shadow-brand-lg">
      {/* Decorative dotted world map */}
      <div className="absolute inset-0 opacity-[0.08]" aria-hidden>
        <svg
          viewBox="0 0 800 400"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="hero-grid"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill="white" />
            </pattern>
          </defs>
          <rect width="800" height="400" fill="url(#hero-grid)" />
          <g fill="white" opacity="0.5">
            <path d="M60 120 Q140 80 220 110 T380 130 L360 180 Q280 200 220 180 T80 170 Z" />
            <path d="M420 100 Q500 80 580 110 T740 130 L720 180 Q640 200 580 180 T440 170 Z" />
            <path d="M120 240 Q200 210 280 240 L260 310 Q200 330 140 310 Z" />
            <path d="M460 230 Q540 200 620 230 L600 300 Q540 320 480 300 Z" />
          </g>
          {/* Route curves */}
          <g
            fill="none"
            stroke="#7FD1A4"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            opacity="0.7"
          >
            <path d="M100 160 Q300 80 500 140 T720 180" />
            <path d="M140 280 Q300 240 460 270 T700 290" />
          </g>
          <g fill="#7FD1A4" opacity="0.9">
            <circle cx="100" cy="160" r="5" />
            <circle cx="500" cy="140" r="5" />
            <circle cx="720" cy="180" r="5" />
            <circle cx="140" cy="280" r="5" />
            <circle cx="460" cy="270" r="5" />
          </g>
        </svg>
      </div>

      {/* Floating vehicles */}
      <div className="absolute top-6 left-6 animate-float opacity-90" aria-hidden>
        <Plane className="h-8 w-8 text-white/80" />
      </div>
      <div
        className="absolute top-1/3 left-1/3 animate-float opacity-80"
        style={{ animationDelay: "1s" }}
        aria-hidden
      >
        <Ship className="h-7 w-7 text-white/70" />
      </div>

      <div className="relative z-10 p-6 sm:p-8 lg:p-10 grid md:grid-cols-2 gap-6 items-center">
        {/* Left: slogan + CTA */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs font-medium">
            <MapPin className="h-3.5 w-3.5" />
            منصة الشحن السعودية الموحدة
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-balance">
            شحن أسهل.. يصل أبعد
          </h2>
          <p className="text-sm sm:text-base text-white/80 max-w-md leading-relaxed">
            أرسل شحناتك المحلية والدولية من مكان واحد، تتبّع لحظي، تسعير فوري،
            ومحفظة ذكية.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 bg-white text-primary hover:bg-white/90 font-semibold"
              onClick={() => navigate("create-shipment")}
            >
              <Plus className="h-4 w-4" />
              أنشئ شحنة جديدة
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              onClick={() => navigate("tracking")}
            >
              <Truck className="h-4 w-4" />
              تتبّع شحنة
            </Button>
          </div>
        </div>

        {/* Right: wallet balance card */}
        <div className="md:justify-self-end w-full md:max-w-xs">
          <div className="rounded-2xl glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/70">الرصيد المتاح</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 border border-white/20">
                SAR
              </span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight" dir="ltr">
              {formatSAR(displayBalance, { withSymbol: false })}
              <span className="text-base font-medium text-white/70 mr-1"> ر.س</span>
            </p>
            <Button
              size="sm"
              className={cn(
                "mt-4 w-full gap-2 bg-white text-primary hover:bg-white/90 font-semibold"
              )}
              onClick={() => navigate("wallet")}
            >
              <Plus className="h-4 w-4" />
              شحن المحفظة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
