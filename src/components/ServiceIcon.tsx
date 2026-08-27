import { Drop, HouseLine, Lightning, PaintBrush, Snowflake, Wrench } from "@/components/Icons";

export default function ServiceIcon({ trade, size = 20 }: { trade: string; size?: number }) {
  const props = { size, weight: "regular" as const, "aria-hidden": true };
  if (trade === "hvac") return <Snowflake {...props} />;
  if (trade === "plumbing") return <Drop {...props} />;
  if (trade === "electrical") return <Lightning {...props} />;
  if (trade === "painting") return <PaintBrush {...props} />;
  if (trade === "roofing") return <HouseLine {...props} />;
  return <Wrench {...props} />;
}
