"use client";

import { useState } from "react";
import type { ClaimStatus } from "@/lib/leadstore";

export default function ClaimStatusButton({ id, initialStatus }: { id: string; initialStatus: ClaimStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  async function update(next: ClaimStatus) {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/claims", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: next }) });
      if (!response.ok) throw new Error();
      setStatus(next);
    } finally {
      setSaving(false);
    }
  }
  return <div className="claim-actions"><span className={`pill ${status === "pending" ? "warn" : status === "rejected" ? "bad" : ""}`}>{status}</span>{status === "pending" && <><button className="small-action" disabled={saving} onClick={() => update("approved")}>Approve</button><button className="small-action danger" disabled={saving} onClick={() => update("rejected")}>Reject</button></>}</div>;
}
