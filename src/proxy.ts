import { NextResponse, type NextRequest } from "next/server";

// Method pages stream inside a Suspense boundary, so by the time the page could notice a bad
// number the 200 status has already been sent. Reject anything outside 01–52 here instead, so
// mistyped or stale links get a real 404.
const VALID = /^(0[1-9]|[1-4]\d|5[0-2])$/;

export function proxy(request: NextRequest) {
  const n = request.nextUrl.pathname.split("/")[2] ?? "";
  if (VALID.test(n)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
}

export const config = { matcher: "/method/:path*" };
