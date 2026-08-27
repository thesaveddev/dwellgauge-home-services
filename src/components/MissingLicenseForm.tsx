"use client";

import Link from "next/link";
import { useState } from "react";

export default function MissingLicenseForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("sending");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("/api/missing-license", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, type: "missing-license" }) });
      if (!response.ok) throw new Error();
      form.reset(); setState("sent");
    } catch { setState("error"); }
  }
  if (state === "sent") return <div className="callout" role="status"><h3>Review request received.</h3><p className="muted">We will compare the details with the official state source. This does not create or change a license.</p></div>;
  return <form className="form-card" onSubmit={submit}>
    <h2>Can’t find your record?</h2>
    <p className="muted small">Tell us where to look. We review submissions against the official licensing authority before adding anything.</p>
    <div className="form-grid">
      <label className="field">Business name<input name="businessName" required maxLength={200} /></label>
      <label className="field">Your name<input name="contactName" required maxLength={120} /></label>
      <label className="field">Business email<input name="email" required type="email" maxLength={254} /></label>
      <label className="field">Phone<input name="phone" type="tel" maxLength={40} /></label>
      <label className="field">State code<input name="stateCode" required pattern="[A-Za-z]{2}" maxLength={2} placeholder="FL" /></label>
      <label className="field">License number<input name="licenseNumber" required maxLength={80} /></label>
      <label className="field">Trade<input name="trade" maxLength={80} placeholder="HVAC, roofing, plumbing" /></label>
      <label className="field">Official record link<input name="officialUrl" type="url" maxLength={500} /></label>
      <label className="field wide">Additional context<textarea name="message" maxLength={2000} /></label>
    </div>
    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
    <label className="consent"><input name="consent" value="true" required type="checkbox" /><span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label>
    <button className="button full" disabled={state === "sending"}>{state === "sending" ? "Sending request" : "Request a review"}</button>
    {state === "error" && <p className="form-error" role="alert">The request could not be saved. Check the fields and try again.</p>}
  </form>;
}
