// "use client";

// import { Truck, Plane, Ship, Plus, MapPin, ArrowLeft, Wallet, Eye, EyeOff } from "lucide-react";
// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { useRouterStore } from "@/store/routerStore";
// import { formatSAR, halToSar } from "@/lib/format";
// import { cn } from "@/lib/utils";

// /**
//  * Hero banner — deep teal-green gradient with dotted world map, floating
//  * transport icons, slogan on the left and a glassmorphism wallet card on the right.
//  *
//  * Brand accent color for primary CTA: lemon-gold (#C5D86D) on dark green (#0F352E).
//  * Matches the brand reference: "شحن أسهل.. يصل أبعد".
//  */
// export function HeroBanner({
//   balance,
//   balanceHal,
//   codPending,
//   codPendingHal,
// }: {
//   balance?: number;
//   balanceHal?: number;
//   codPending?: number;
//   codPendingHal?: number;
// }) {
//   const navigate = useRouterStore((s) => s.navigate);
//   const [showBalance, setShowBalance] = useState(true);

//   // Prefer balanceHal (from real API) → fall back to balance.
//   const displayBalance = balanceHal ? halToSar(balanceHal) : (balance ?? 0);
//   const displayCodPending = codPendingHal ? halToSar(codPendingHal) : (codPending ?? 0);

//   return (
//     <div className="relative overflow-hidden rounded-2xl bg-brand-gradient text-white shadow-brand-lg">
//       {/* Decorative dotted world map */}
//       <div className="absolute inset-0 opacity-[0.08]" aria-hidden>
//         <svg viewBox="0 0 800 400" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
//           <defs>
//             <pattern id="hero-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
//               <circle cx="2" cy="2" r="1.2" fill="white" />
//             </pattern>
//           </defs>
//           <rect width="800" height="400" fill="url(#hero-grid)" />
//           <g fill="white" opacity="0.5">
//             <path d="M60 120 Q140 80 220 110 T380 130 L360 180 Q280 200 220 180 T80 170 Z" />
//             <path d="M420 100 Q500 80 580 110 T740 130 L720 180 Q640 200 580 180 T440 170 Z" />
//             <path d="M120 240 Q200 210 280 240 L260 310 Q200 330 140 310 Z" />
//             <path d="M460 230 Q540 200 620 230 L600 300 Q540 320 480 300 Z" />
//           </g>
//           {/* Route curves */}
//           <g fill="none" stroke="#A3D9A5" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.7">
//             <path d="M100 160 Q300 80 500 140 T720 180" />
//             <path d="M140 280 Q300 240 460 270 T700 290" />
//           </g>
//           <g fill="#A3D9A5" opacity="0.9">
//             <circle cx="100" cy="160" r="5" />
//             <circle cx="500" cy="140" r="5" />
//             <circle cx="720" cy="180" r="5" />
//             <circle cx="140" cy="280" r="5" />
//             <circle cx="460" cy="270" r="5" />
//           </g>
//         </svg>
//       </div>

//       {/* Floating vehicles */}
//       <div className="absolute top-6 left-6 animate-float opacity-90" aria-hidden>
//         <Plane className="h-8 w-8 text-white/80" />
//       </div>
//       <div
//         className="absolute top-1/3 left-1/3 animate-float opacity-80"
//         style={{ animationDelay: "1s" }}
//         aria-hidden
//       >
//         <Ship className="h-7 w-7 text-white/70" />
//       </div>

//       <div className="relative z-10 p-6 sm:p-8 lg:p-10 grid md:grid-cols-2 gap-6 items-center">
//         {/* Left: slogan + golden CTA */}
//         <div className="space-y-4">
//           <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs font-medium">
//             <MapPin className="h-3.5 w-3.5" />
//             منصة الشحن السعودية الموحدة
//           </div>
//           <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-balance">
//             شحن أسهل.. يصل أبعد
//           </h2>
//           <p className="text-sm sm:text-base text-white/80 max-w-md leading-relaxed">
//             أرسل شحناتك المحلية والدولية من مكان واحد، تتبّر لحظي، تسعير فوري،
//             ومحفظة ذكية.
//           </p>
//           <div className="flex flex-wrap items-center gap-3 pt-2">
//             {/* Golden lemon CTA — brand identity color */}
//             <Button
//               size="lg"
//               className="gap-2 bg-[#C5D86D] text-[#0F352E] hover:bg-[#d3e47e] font-bold rounded-full shadow-emerald"
//               onClick={() => navigate("create-shipment")}
//             >
//               <Plus className="h-4 w-4" />
//               ابدأ شحنتك الآن
//               <ArrowLeft className="h-4 w-4 rtl-flip" />
//             </Button>
//             <Button
//               size="lg"
//               variant="outline"
//               className="gap-2 border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white rounded-full"
//               onClick={() => navigate("tracking")}
//             >
//               <Truck className="h-4 w-4" />
//               تتبّع شحنة
//             </Button>
//           </div>
//         </div>

//         {/* Right: wallet balance card — glassmorphism style */}
//         <div className="md:justify-self-end w-full md:max-w-xs">
//           <div className="rounded-2xl glass-card-strong p-5">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-2">
//                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
//                   <Wallet className="h-4 w-4 text-white" />
//                 </div>
//                 <p className="text-xs text-white/80 font-medium">الرصيد المتاح</p>
//               </div>
//               <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 border border-white/20">
//                 SAR
//               </span>
//             </div>

//             <div className="flex items-end gap-2 mb-1">
//               <p className="text-3xl font-extrabold tracking-tight" dir="ltr">
//                 {showBalance ? formatSAR(displayBalance, { withSymbol: false }) : "••••••"}
//               </p>
//               {showBalance && (
//                 <span className="text-base font-medium text-white/70 mb-1">ر.س</span>
//               )}
//               <button
//                 type="button"
//                 onClick={() => setShowBalance((v) => !v)}
//                 className="ms-auto mb-1.5 text-white/60 hover:text-white transition-colors p-1 rounded"
//                 aria-label={showBalance ? "إخفاء الرصيد" : "إظهار الرصيد"}
//               >
//                 {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//               </button>
//             </div>

//             <p className="text-[11px] text-white/60 mb-3">
//               {showBalance ? "رصيدك القابل للاستخدام في الشحن" : "الرصيد مخفي"}
//             </p>

//             {/* COD pending — second balance line */}
//             {displayCodPending > 0 && (
//               <div className="flex items-center justify-between rounded-lg bg-white/8 border border-white/10 px-3 py-2 mb-3">
//                 <p className="text-[11px] text-white/70">COD معلّق للاستلام</p>
//                 <p className="text-sm font-bold text-amber-300" dir="ltr">
//                   {showBalance ? formatSAR(displayCodPending, { withSymbol: false }) : "••••"} ر.س
//                 </p>
//               </div>
//             )}

//             <Button
//               size="sm"
//               className={cn(
//                 "mt-1 w-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-emerald"
//               )}
//               onClick={() => navigate("wallet")}
//             >
//               <Plus className="h-4 w-4" />
//               شحن المحفظة
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



"use client";

import { Truck, Plane, Ship, Plus, MapPin, ArrowLeft, Wallet, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouterStore } from "@/store/routerStore";
import { formatSAR, halToSar } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Hero banner — compact padding on mobile (`p-4`), spacious on laptop (`lg:p-8`).
 */
export function HeroBanner({
  balance,
  balanceHal,
  codPending,
  codPendingHal,
}: {
  balance?: number;
  balanceHal?: number;
  codPending?: number;
  codPendingHal?: number;
}) {
  const navigate = useRouterStore((s) => s.navigate);
  const [showBalance, setShowBalance] = useState(true);

  const displayBalance = balanceHal ? halToSar(balanceHal) : (balance ?? 0);
  const displayCodPending = codPendingHal ? halToSar(codPendingHal) : (codPending ?? 0);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-gradient text-white shadow-brand-lg">
      {/* Decorative dotted world map */}
      <div className="absolute inset-0 opacity-[0.08]" aria-hidden>
        <svg viewBox="0 0 800 400" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
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
          <g fill="none" stroke="#A3D9A5" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.7">
            <path d="M100 160 Q300 80 500 140 T720 180" />
            <path d="M140 280 Q300 240 460 270 T700 290" />
          </g>
          <g fill="#A3D9A5" opacity="0.9">
            <circle cx="100" cy="160" r="5" />
            <circle cx="500" cy="140" r="5" />
            <circle cx="720" cy="180" r="5" />
            <circle cx="140" cy="280" r="5" />
            <circle cx="460" cy="270" r="5" />
          </g>
        </svg>
      </div>

      {/* Floating vehicles */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 animate-float opacity-90" aria-hidden>
        <Plane className="h-6 w-6 sm:h-8 sm:w-8 text-white/80" />
      </div>
      <div
        className="hidden sm:block absolute top-1/3 left-1/3 animate-float opacity-80"
        style={{ animationDelay: "1s" }}
        aria-hidden
      >
        <Ship className="h-7 w-7 text-white/70" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 grid md:grid-cols-2 gap-4 sm:gap-6 items-center">
        {/* Right/Top: slogan + golden CTA */}
        <div className="space-y-2.5 sm:space-y-3.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-medium">
            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            منصة الشحن السعودية الموحدة
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold leading-tight text-balance">
            شحن أسهل.. يصل أبعد
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-white/80 max-w-md leading-relaxed">
            أرسل شحناتك المحلية والدولية من مكان واحد، تتبّع لحظي، تسعير فوري،
            ومحفظة ذكية.
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
            <Button
              size="default"
              className="h-9 sm:h-10 px-4 gap-1.5 bg-[#C5D86D] text-[#0F352E] hover:bg-[#d3e47e] text-xs sm:text-sm font-bold rounded-full shadow-emerald"
              onClick={() => navigate("create-shipment")}
            >
              <Plus className="h-4 w-4" />
              ابدأ شحنتك الآن
              <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
            </Button>
            <Button
              size="default"
              variant="outline"
              className="h-9 sm:h-10 px-4 gap-1.5 border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white text-xs sm:text-sm rounded-full"
              onClick={() => navigate("tracking")}
            >
              <Truck className="h-4 w-4" />
              تتبّع شحنة
            </Button>
          </div>
        </div>

        {/* Left/Bottom: wallet balance card — compact on mobile */}
        <div className="md:justify-self-end w-full md:max-w-xs">
          <div className="rounded-xl sm:rounded-2xl glass-card-strong p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white/15">
                  <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
                <p className="text-xs text-white/80 font-medium">الرصيد المتاح</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 border border-white/20">
                SAR
              </span>
            </div>

            <div className="flex items-end gap-2 mb-1">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight" dir="ltr">
                {showBalance ? formatSAR(displayBalance, { withSymbol: false }) : "••••••"}
              </p>
              {showBalance && (
                <span className="text-xs sm:text-sm font-medium text-white/70 mb-1">ر.س</span>
              )}
              <button
                type="button"
                onClick={() => setShowBalance((v) => !v)}
                className="ms-auto mb-1 text-white/60 hover:text-white transition-colors p-1 rounded"
                aria-label={showBalance ? "إخفاء الرصيد" : "إظهار الرصيد"}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {displayCodPending > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-white/8 border border-white/10 px-2.5 py-1.5 mb-2">
                <p className="text-[10px] sm:text-[11px] text-white/70">COD معلّق للاستلام</p>
                <p className="text-xs sm:text-sm font-bold text-amber-300" dir="ltr">
                  {showBalance ? formatSAR(displayCodPending, { withSymbol: false }) : "••••"} ر.س
                </p>
              </div>
            )}

            <Button
              size="sm"
              className={cn(
                "w-full h-8 sm:h-9 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-emerald"
              )}
              onClick={() => navigate("wallet")}
            >
              <Plus className="h-3.5 w-3.5" />
              شحن المحفظة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}