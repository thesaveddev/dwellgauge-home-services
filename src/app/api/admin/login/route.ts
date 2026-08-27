import { NextResponse } from "next/server";
import { checkPassword, createToken, ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const form = await request.formData();
  if (!checkPassword(String(form.get("password") ?? ""))) { await recordAudit({ actor: "unknown", action: "admin.login.failed", entityType: "session", ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() }); return NextResponse.redirect(new URL("/admin?error=1", request.url), 303); }
  await recordAudit({ actor: "admin", action: "admin.login.succeeded", entityType: "session", ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, createToken(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: ADMIN_COOKIE_MAX_AGE, path: "/" });
  return response;
}
