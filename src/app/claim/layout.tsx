import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Claim a contractor listing",
  description: "Request ownership of a DwellGauge contractor profile.",
  path: "/claim",
  noindex: true,
});

export default function ClaimLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
