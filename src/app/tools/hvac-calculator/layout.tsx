import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "HVAC Replacement Cost Calculator",
  description: "Estimate a rough HVAC replacement size and installed budget from home square footage and climate. Use a Manual J calculation before buying equipment.",
  path: "/tools/hvac-calculator",
  keywords: ["HVAC replacement calculator", "HVAC cost calculator", "how many tons HVAC", "air conditioner replacement cost"],
});

export default function HvacCalculatorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
