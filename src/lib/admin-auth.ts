import crypto from "node:crypto";
import { cookies } from "next/headers";
import { assertProductionConfig } from "./config";

const COOKIE = "tp_admin";
const MAX_AGE = 60 * 60 * 12; // 12h
const FALLBACK_SECRET = crypto.randomBytes(32).toString("hex");

function secret(): string {
  return process.env.AUTH_SECRET ?? FALLBACK_SECRET;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createToken(): string {
  assertProductionConfig();
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + MAX_AGE * 1000 })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): boolean {
  try { assertProductionConfig(); } catch { return false; }
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (expected.length !== sig.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function checkPassword(input: string | undefined): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!input || !expected || input.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

export async function isAdminAuthenticated(): Promise<boolean> {
  assertProductionConfig();
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

export const ADMIN_COOKIE = COOKIE;
export const ADMIN_COOKIE_MAX_AGE = MAX_AGE;
