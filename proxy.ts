import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple per-IP rate limiting for the submissions endpoint, which is reachable
// by any visitor of any site that embeds the widget.
//
// NOTE: this is an in-memory limiter (per server instance). For a multi-instance
// production deployment, replace it with a shared store (e.g. Redis/Upstash).
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/api/submissions") {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const now = Date.now();
    let bucket = buckets.get(ip);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + WINDOW_MS };
      buckets.set(ip, bucket);
    }

    bucket.count += 1;

    if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { error: "Too many requests, please try again later." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/submissions",
};
