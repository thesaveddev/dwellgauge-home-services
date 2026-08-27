"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/Icons";
import { useEffect, useState } from "react";

export default function Claim() {
  const [license, setLicense] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    setLicense(new URLSearchParams(window.location.search).get("license") ?? "");
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, type: "claim", licenseRef: license }) });
      if (!response.ok) throw new Error();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return <>
    <div className="page-hero"><div className="wrap"><div className="breadcrumbs"><Link href="/">Home</Link> / Claim listing</div><h1>Claim a contractor listing.</h1><p>Use this request to correct a public record, add service-area context, or ask how a profile can participate on DwellGauge.</p></div></div>
    <section className="section"><div className="wrap form-layout"><div className="form-intro"><h2>Ownership review</h2><p className="muted">We may ask for information that helps establish your relationship to the business. A claim request does not change the official state record.</p><div className="callout"><h3>What to include</h3><p className="small muted">Use a business email, the license number when you have it, and a short description of the correction or request.</p></div></div>{state === "sent" ? <div className="callout" role="status"><h2>Request received.</h2><p className="muted">We will review the details and email you with next steps.</p><Link className="button" href="/licenses">Return to license lookup <ArrowRight size={16} aria-hidden /></Link></div> : <form className="form-card" onSubmit={submit}><h2>Send a claim request</h2><input type="hidden" name="licenseRef" value={license} /><label className="field">Business name<input required name="businessName" /></label><label className="field">Your name<input required name="contactName" /></label><label className="field">Business email<input required type="email" name="email" /></label><label className="field">Phone<input name="phone" type="tel" /></label><label className="field">What should we review?<textarea name="message" /></label><input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} /><label className="consent"><input name="consent" value="true" required type="checkbox" /> <span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label><button className="button full" disabled={state === "sending"}>{state === "sending" ? "Sending request" : <>Submit claim request <ArrowRight size={16} aria-hidden /></>}</button>{state === "error" && <p className="form-error" role="alert">The request could not be saved. Check the fields and try again.</p>}</form>}</div></section>
  </>;
}
