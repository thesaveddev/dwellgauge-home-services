import { absoluteUrl } from "./site";

export const MAX_BODY_BYTES = 32 * 1024;

export function trustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return origin === new URL(absoluteUrl("/")).origin; } catch { return false; }
}

export function requestWithinSize(request: Request): boolean {
  const length = request.headers.get("content-length");
  return !length || Number(length) <= MAX_BODY_BYTES;
}

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
