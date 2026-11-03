"use client";

import { useTranslation } from "@/i18n";

/**
 * Lightweight Code128-like SVG barcode generator (no external deps).
 */

interface BarcodeSvgProps {
  /** The value to encode (typically the tracking number). */
  value: string;
  /** Rendered width in px (height is auto). Default 320. */
  width?: number;
  /** Bar height in px. Default 64. */
  height?: number;
  /** Show the human-readable value below the bars. Default true. */
  showText?: boolean;
  /** Optional className for the SVG. */
  className?: string;
}

export function BarcodeSvg({
  value,
  width = 320,
  height = 64,
  showText = true,
  className,
}: BarcodeSvgProps) {
  const { t } = useTranslation();

  if (!value) return null;

  // Build a deterministic bar pattern from the string.
  const bars: { x: number; w: number; black: boolean }[] = [];
  let cursor = 8; // quiet zone (8 units)
  const unitWidth = (width - 16) / (value.length * 6); // 6 units per char average

  // Start bar (always black, 2 units wide)
  bars.push({ x: cursor, w: unitWidth * 2, black: true });
  cursor += unitWidth * 2;
  bars.push({ x: cursor, w: unitWidth, black: false });
  cursor += unitWidth;

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const w1 = ((code % 4) + 1) * unitWidth;
    const w2 = (((code >> 2) % 3) + 1) * unitWidth;
    const w3 = (((code >> 4) % 4) + 1) * unitWidth;
    bars.push({ x: cursor, w: w1, black: true });
    cursor += w1;
    bars.push({ x: cursor, w: w2, black: false });
    cursor += w2;
    bars.push({ x: cursor, w: w3, black: true });
    cursor += w3;
    // Inter-char gap
    bars.push({ x: cursor, w: unitWidth, black: false });
    cursor += unitWidth;
  }

  // Stop bar
  bars.push({ x: cursor, w: unitWidth * 3, black: true });

  const totalHeight = showText ? height + 18 : height;

  return (
    <svg
      width={width}
      height={totalHeight}
      viewBox={`0 0 ${width} ${totalHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={t("awbModal.barcodeAria", { value })}
    >
      <rect width={width} height={totalHeight} fill="white" />
      {bars
        .filter((b) => b.black)
        .map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="black" />
        ))}
      {showText && (
        <text
          x={width / 2}
          y={height + 14}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fontFamily="monospace"
          fill="black"
          letterSpacing="2"
        >
          {value}
        </text>
      )}
    </svg>
  );
}
