import { NextRequest, NextResponse } from "next/server";

/**
 * Universal API proxy.
 * Forwards all /api/proxy/<path> requests to the Masar X backend.
 * This bypasses browser CORS and keeps the backend base URL server-side.
 */

const BACKEND_URL = process.env.BACKEND_URL?.trim();

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const params = await ctx.params;
  const pathSegments = params.path ?? [];
  const path = pathSegments.join("/");
  if (!path) {
    return NextResponse.json(
      { ok: false, error: "missing_path" },
      { status: 400 }
    );
  }

  if (!BACKEND_URL) {
    return NextResponse.json(
      { ok: false, error: "backend_not_configured", message: "BACKEND_URL غير مضبوط على الخادم" },
      { status: 503 }
    );
  }

  let backendBase: URL;
  try {
    backendBase = new URL(BACKEND_URL);
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_backend_url" },
      { status: 500 }
    );
  }
  if (process.env.NODE_ENV === "production" && backendBase.protocol !== "https:") {
    return NextResponse.json(
      { ok: false, error: "https_required", message: "يجب استخدام HTTPS مع بيئة الإنتاج" },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const target = new URL(`${backendBase.toString().replace(/\/$/, "")}/${path}${url.search}`);

  const headers = new Headers();
  const skip = new Set([
    "host",
    "connection",
    "content-length",
    "transfer-encoding",
    "keep-alive",
    "upgrade",
    "proxy-connection",
    "te",
    "trailer",
  ]);
  req.headers.forEach((v, k) => {
    if (!skip.has(k.toLowerCase())) headers.set(k, v);
  });

  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
    duplex: "half",
  };

  if (!["GET", "HEAD"].includes(req.method)) {
    init.body = req.body as unknown as BodyInit;
  }

  try {
    const upstream = await fetch(target.toString(), init);
    const respHeaders = new Headers();
    upstream.headers.forEach((v, k) => {
      const lk = k.toLowerCase();
      if (
        ![
          "content-encoding",
          "content-length",
          "transfer-encoding",
          "connection",
          "keep-alive",
        ].includes(lk)
      ) {
        respHeaders.set(k, v);
      }
    });
    if (!respHeaders.has("content-type")) {
      respHeaders.set("content-type", "application/json");
    }
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "upstream_error";
    return NextResponse.json(
      { ok: false, error: "proxy_error", message },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
