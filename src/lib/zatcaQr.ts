"use client";

import QRCode from "qrcode";

/**
 * ZATCA (Saudi tax authority) e-invoice QR code generator.
 *
 * Builds the official TLV (Tag-Length-Value) payload defined by ZATCA Phase 1:
 *   Tag 1 — Seller name
 *   Tag 2 — VAT registration number
 *   Tag 3 — Invoice timestamp (ISO-8601 UTC)
 *   Tag 4 — Invoice total (with VAT)
 *   Tag 5 — VAT amount
 * The payload is base64-encoded and rendered as a scannable QR SVG.
 *
 * Reference: ZATCA E-Invoicing Technical Specification (TLV base64 QR).
 */

interface ZatcaInvoiceInput {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO-8601
  totalWithVat: string; // already formatted, e.g. "150.00"
  vatAmount: string; // already formatted, e.g. "19.57"
}

/** Encodes a single TLV field: [tag][length][value bytes]. */
function tlvField(tag: number, value: string): Uint8Array {
  const bytes = new TextEncoder().encode(value);
  const out = new Uint8Array(2 + bytes.length);
  out[0] = tag;
  out[1] = bytes.length;
  out.set(bytes, 2);
  return out;
}

/** Builds the ZATCA TLV base64 payload from invoice fields. */
export function buildZatcaPayload(input: ZatcaInvoiceInput): string {
  const fields = [
    tlvField(1, input.sellerName || "مسار إكس"),
    tlvField(2, input.vatNumber || "300000000000003"),
    tlvField(3, input.timestamp || new Date().toISOString()),
    tlvField(4, String(input.totalWithVat)),
    tlvField(5, String(input.vatAmount)),
  ];
  const totalLength = fields.reduce((sum, f) => sum + f.length, 0);
  const buf = new Uint8Array(totalLength);
  let offset = 0;
  for (const f of fields) {
    buf.set(f, offset);
    offset += f.length;
  }
  // Convert to base64 in chunks (btoa fails on large UTF-8).
  let binary = "";
  for (let i = 0; i < buf.length; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary);
}

/** Renders a ZATCA QR code as an inline SVG string (ready for dangerouslySetInnerHTML). */
export async function renderZatcaQrSvg(input: ZatcaInvoiceInput): Promise<string> {
  const payload = buildZatcaPayload(input);
  const svg = await QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#0D3B3E", light: "#FFFFFF" },
  });
  return svg;
}

/** Renders a ZATCA QR code as a data URL (useful for <img src>). */
export async function renderZatcaQrDataUrl(input: ZatcaInvoiceInput): Promise<string> {
  const payload = buildZatcaPayload(input);
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#0D3B3E", light: "#FFFFFF" },
    width: 220,
  });
  return dataUrl;
}
