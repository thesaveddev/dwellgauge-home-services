export interface Benchmark {
  low: number;
  median: number;
  high: number;
  unit: string;
  basis: string;
}

export interface ComputeInputs {
  benchmark: Benchmark;
  /** Share of project cost that is labor, e.g. 0.45 */
  laborShare: number;
  materialsShare: number;
  overheadShare: number;
  /** metro mean wage / national mean wage for the trade's occupation */
  wageRatio: number;
  /** regional materials cost factor, e.g. 1.06 */
  materialsFactor: number;
  /** share of homes built before 1980 in the metro (complexity proxy), e.g. 0.52 -> up to +5% */
  pre1980Share?: number;
  /** heating/cooling intensity modifier, applied only to climate-sensitive services */
  climateModifier?: number;
  /** estimated residential permit fee for this work in this city */
  permitFee?: number;
}

export interface CostComponent {
  label: string;
  amount: number;
}

export interface CostEstimate {
  low: number;
  median: number;
  high: number;
  components: CostComponent[];
  adjustments: {
    wageRatio: number;
    materialsFactor: number;
    ageComplexity: number;
    climate: number;
    permitFee: number;
  };
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/**
 * Location-adjusted project cost.
 *
 * Methodology (see /methodology):
 *   base      = national benchmark median
 *   locAdj    = laborShare*wageRatio + materialsShare*materialsFactor + overheadShare
 *   condition = 1 + ageComplexity + climate
 *   median    = base * locAdj * condition (+ permitFee)
 *   range     = median -18% .. median +28%, snapped to $50
 *
 * Age complexity adds up to +6% scaled by pre-1980 housing share; climate adds
 * its modifier only where the service is climate-sensitive (HVAC).
 */
export function computeCostEstimate(inputs: ComputeInputs): CostEstimate {
  const {
    benchmark,
    laborShare,
    materialsShare,
    overheadShare,
    wageRatio,
    materialsFactor,
    pre1980Share = 0,
    climateModifier = 0,
    permitFee = 0,
  } = inputs;

  const ageComplexity = round2(pre1980Share * 0.12);

  const locAdj =
    laborShare * clamp(wageRatio, 0.7, 1.5) +
    materialsShare * materialsFactor +
    overheadShare;

  const condition = 1 + ageComplexity + climateModifier;

  const median = roundTo(benchmark.median * locAdj * condition + permitFee, 50);
  const low = roundTo(median * 0.82, 50);
  const high = roundTo(median * 1.28, 50);

  // Split the adjusted median into visible components (permit shown separately).
  const projectOnly = median - permitFee;
  const components: CostComponent[] = [
    { label: "Labor", amount: roundTo(projectOnly * laborShare, 10) },
    { label: "Materials & equipment", amount: roundTo((projectOnly * materialsShare) / materialsFactor, 10) },
    { label: "Overhead & disposal", amount: roundTo(projectOnly * overheadShare, 10) },
    { label: "Permits & inspection", amount: permitFee },
  ];

  return { low, median, high, components, adjustments: { wageRatio: round2(wageRatio), materialsFactor, ageComplexity, climate: climateModifier, permitFee } };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
