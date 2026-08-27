import type { Claim, Lead } from "./leadstore";

type NotifyTarget = Lead | Claim;

export async function notifyLead(item: NotifyTarget): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.LEAD_NOTIFY_EMAIL;
  if (!apiKey || !recipient) return;
  const isClaim = "licenseId" in item;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.LEAD_NOTIFY_FROM || "DwellGauge <onboarding@resend.dev>",
      to: [recipient],
      subject: `New ${isClaim ? "claim" : item.type} request on DwellGauge`,
      text: isClaim
        ? [`A contractor claim was submitted at ${siteUrl}.`, `Business: ${item.businessName}`, `Contact: ${item.contactName}`, `Email: ${item.email}`, `Phone: ${item.phone || "Not provided"}`, `License: ${item.licenseId}`, `Message:\n${item.message || "Not provided"}`].join("\n")
        : [`A new ${item.type} request was submitted at ${siteUrl}.`, `Name: ${item.name || "Not provided"}`, `Email: ${item.email || "Not provided"}`, `Phone: ${item.phone || "Not provided"}`, `Service: ${item.serviceSlug || "Not specified"}`, `Metro: ${item.metroSlug || "Not specified"}`, `Message:\n${item.message || "Not provided"}`].join("\n"),
    }),
  });
  if (!response.ok) throw new Error(`Lead notification failed: HTTP ${response.status}`);
}
