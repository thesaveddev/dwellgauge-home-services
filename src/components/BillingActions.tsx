"use client";

import { useState } from "react";

export default function BillingActions({ priceId }: { priceId?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function open(path: string, body: Record<string, string>) { setError(null); setBusy(path.includes("checkout") ? "checkout" : "portal"); try { const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok || !data.url) throw new Error(data.error || "Unable to open billing."); window.location.assign(data.url); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to open billing."); setBusy(null); } }
  return <div className="billing-actions"><label className="field">Billing email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label><div className="hero-actions"><button className="button" disabled={!priceId || !email || !!busy} onClick={() => priceId && open("/api/billing/checkout", { email, priceId })}>{busy === "checkout" ? "Opening checkout..." : "Choose featured listing"}</button><button className="button secondary" disabled={!email || !!busy} onClick={() => open("/api/billing/portal", { email })}>{busy === "portal" ? "Opening portal..." : "Manage billing"}</button></div>{!priceId && <p className="small muted">Add a Stripe Price ID before enabling checkout.</p>}{error && <p className="small" style={{ color: "#a23b35" }}>{error}</p>}</div>;
}
