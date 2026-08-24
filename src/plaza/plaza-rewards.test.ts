import { describe, expect, it } from "vitest";
import { nextUnlock, rewardForSession } from "./plaza-rewards";

describe("plaza rewards", () => {
  it("rewards a completed focus session without punishing interruptions", () => {
    expect(
      rewardForSession({
        completionStatus: "completed",
        elapsedMs: 25 * 60_000,
        returnCount: 2,
      }),
    ).toMatchObject({ growthPoints: 25, rewardId: "sticker-sun" });
  });

  it("gives incomplete sessions a smaller positive reward", () => {
    expect(
      rewardForSession({ completionStatus: "incomplete", elapsedMs: 10 * 60_000, returnCount: 0 }),
    ).toMatchObject({ growthPoints: 10 });
  });

  it("returns the first locked cosmetic at the next threshold", () => {
    expect(nextUnlock({ growthPoints: 20, unlockedCosmeticIds: ["sticker-sun"] })).toEqual({
      id: "hat-leaf",
      kind: "companion",
      label: "Leaf cap",
      requiredGrowthPoints: 50,
    });
  });
});
