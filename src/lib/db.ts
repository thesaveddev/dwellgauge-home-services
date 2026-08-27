// Centralized PostgreSQL connection helper.
//
// Every pool in the application must be created through createPool so that
// TLS, timeouts, and pool limits are enforced consistently in production.
// The pg module is loaded lazily (CJS require) to match the project's
// existing pattern and avoid top-level module interop issues.

import type { Pool, PoolConfig } from "pg";

const SSL_MODES = new Set(["require", "verify-ca", "verify-full"]);

function isLoopback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Rejects insecure connection strings in production; returns the cleaned URL. */
export function assertSecureDatabaseUrl(url: string): string {
  const clean = url.trim();
  if (!/^postgres(ql)?:\/\//i.test(clean)) {
    throw new Error("DATABASE_URL must be a postgres:// or postgresql:// URL.");
  }
  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }
  const sslmode = parsed.searchParams.get("sslmode");
  // Production requires TLS for remote connections. Loopback is exempt because
  // the traffic never leaves the machine (local development builds run with
  // NODE_ENV=production but connect to a local database).
  if (process.env.NODE_ENV === "production" && !isLoopback(parsed.hostname) && (!sslmode || !SSL_MODES.has(sslmode))) {
    throw new Error("DATABASE_URL must set sslmode=require (or verify-ca/verify-full) in production for non-loopback hosts.");
  }
  return clean;
}

export function createPool(max = 5): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  const connectionString = assertSecureDatabaseUrl(url);
  const config: PoolConfig = {
    connectionString,
    max,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 15_000,
    query_timeout: 20_000,
    application_name: "dwellgauge",
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool: PgPool } = require("pg") as typeof import("pg");
  return new PgPool(config);
}
