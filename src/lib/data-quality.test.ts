import { describe, expect, it } from "vitest";
import { validateEstimates, validatePermitObservations, validateWageRatios } from "../../scripts/lib/data-quality";

describe("dataset quality gates", () => {
  it("accepts valid wage ratios", () => expect(validateWageRatios({ "12345:499021": 1.1 }).valid).toBe(true));
  it("rejects unsafe wage ratios", () => expect(validateWageRatios({ "bad": 4 }).valid).toBe(false));
  it("rejects malformed permit observations", () => expect(validatePermitObservations([{ jurisdiction: "Miami", permitType: "mechanical", amount: -1, issuedAt: "bad" }]).valid).toBe(false));
  it("rejects unordered or incomplete estimates", () => expect(validateEstimates([{ serviceSlug: "hvac", metroSlug: "miami", low: 2, median: 1, high: 3 }], 1).valid).toBe(false));
});
