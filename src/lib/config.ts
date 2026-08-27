export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function hasDatabase(): boolean { return Boolean(process.env.DATABASE_URL); }

export function assertProductionConfig(): void {
  if (!isProduction()) return;
  const missing = ["NEXT_PUBLIC_SITE_URL", "ADMIN_PASSWORD", "AUTH_SECRET", "DATABASE_URL"].filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  if ((process.env.AUTH_SECRET ?? "").length < 32) throw new Error("AUTH_SECRET must be at least 32 characters in production");
  if ((process.env.ADMIN_PASSWORD ?? "").length < 16) throw new Error("ADMIN_PASSWORD must be at least 16 characters in production");
}
