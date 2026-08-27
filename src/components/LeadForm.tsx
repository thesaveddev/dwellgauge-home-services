"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/Icons";
import { useState } from "react";

export default function LeadForm({ serviceSlug, metroSlug, licenseRef, compact = false }: { serviceSlug?: string; metroSlug?: string; licenseRef?: string; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, serviceSlug, metroSlug, licenseRef, landingPath: window.location.pathname, utmSource: new URLSearchParams(window.location.search).get("utm_source") || undefined, utmMedium: new URLSearchParams(window.location.search).get("utm_medium") || undefined, utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign") || undefined, type: licenseRef ? "claim" : "quote" }),
      });
      if (!res.ok) throw new Error();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") return <div className="callout"><h3>Request received.</h3><p className="muted">Thanks. A local partner will follow up shortly. Check your inbox for a confirmation.</p></div>;

  return <form onSubmit={submit} className="form-card">
    <h2>{compact ? "Get matched with a pro" : "Request free quotes"}</h2>
    <p className="muted small">No obligation. We&apos;ll connect you with licensed contractors in your area.</p>
    <div className="form-grid">
      <label className="field">Name<input name="name" required placeholder="Your name" /></label>
      <label className="field">Email<input name="email" required type="email" placeholder="you@example.com" /></label>
      <label className="field">Phone<input name="phone" required type="tel" placeholder="(555) 555-5555" /></label>
      <label className="field">ZIP code<input name="zip" required pattern="[0-9]{5}" placeholder="90210" /></label>
      <label className="field wide">What do you need?<textarea name="message" required placeholder="Tell us briefly about your project..." /></label>
    </div>
    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
    <label className="consent"><input name="consent" value="true" required type="checkbox" /> <span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>, including sharing this request with relevant service providers.</span></label>
    <button className="button full" disabled={state === "sending"}>{state === "sending" ? "Sending..." : <>Connect me with pros <ArrowRight size={16} aria-hidden /></>}</button>
    {state === "error" && <p className="small form-error" role="alert">We could not save the request. Check the fields and try again.</p>}
  </form>;
}
