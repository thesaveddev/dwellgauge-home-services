"use client";

import { useState } from "react";

export default function LeadOutcomeControl({ id, initialStatus, initialOutcome, initialRevenue }: { id: string; initialStatus: string; initialOutcome?: string; initialRevenue?: number }) {
  const [status, setStatus] = useState(initialStatus);
  const [outcome, setOutcome] = useState(initialOutcome || "new");
  const [revenue, setRevenue] = useState(initialRevenue ? String(initialRevenue / 100) : "");
  const [contractor, setContractor] = useState("");
  const [saved, setSaved] = useState(false);
  async function save() { setSaved(false); const response = await fetch("/api/admin/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, outcome, assignedContractor: contractor || undefined, revenueCents: revenue ? Math.round(Number(revenue) * 100) : undefined, currency: "USD" }) }); if (response.ok) setSaved(true); }
  return <div className="lead-outcome-control"><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Lead status"><option value="new">New</option><option value="routed">Routed</option><option value="archived">Archived</option></select><select value={outcome} onChange={(e) => setOutcome(e.target.value)} aria-label="Lead outcome"><option value="new">Unqualified</option><option value="contacted">Contacted</option><option value="won">Won</option><option value="lost">Lost</option></select><input value={contractor} onChange={(e) => setContractor(e.target.value)} placeholder="Contractor" aria-label="Assigned contractor" /><input value={revenue} onChange={(e) => setRevenue(e.target.value)} inputMode="decimal" placeholder="Revenue $" aria-label="Revenue in dollars" /><button className="button secondary" onClick={save}>{saved ? "Saved" : "Save"}</button></div>;
}
