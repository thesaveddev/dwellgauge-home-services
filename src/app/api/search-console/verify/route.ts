import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  const token = process.env.GOOGLE_SITE_VERIFICATION;
  if (!token) return new NextResponse("Verification token is not configured.", { status: 404 });
  return new NextResponse(`google-site-verification: ${token}`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
