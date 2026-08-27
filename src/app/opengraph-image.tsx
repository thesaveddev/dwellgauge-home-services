import { ImageResponse } from "next/og";

export const alt = "DwellGauge Home Services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "#f1f4f2", color: "#17221f", fontFamily: "sans-serif" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "18px", color: "#c84d3b", fontSize: 27, fontWeight: 700 }}>DWELLGAUGE <span style={{ color: "#5f6e68", fontSize: 21 }}>HOME SERVICES</span></div>
    <div style={{ display: "flex", flexDirection: "column", marginTop: 42, fontSize: 72, lineHeight: 1.05, fontWeight: 700 }}> <span>Plan the work.</span><span style={{ color: "#c84d3b" }}>Verify the pro.</span></div>
    <div style={{ display: "flex", marginTop: 30, fontSize: 28, color: "#5f6e68" }}>Local project estimates and public contractor records.</div>
  </div>, size);
}
