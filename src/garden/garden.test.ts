import { describe, expect, it } from "vitest";
import { deriveGarden, deriveGardenPlant } from "./garden";
import type { SessionSummary } from "../storage/repository";

function summary(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    awarenessCount: 0,
    durationMs: 25 * 60_000,
    elapsedMs: 25 * 60_000,
    finishedAtMs: 26_000,
    finishReason: "completed",
    goal: "Review joins",
    reflection: "yes",
    schemaVersion: 1,
    sessionId: "session-1",
    startedAtMs: 1_000,
    subject: "SQL",
    ...overrides,
  };
}

describe("Learning Garden derivation", () => {
  it("derives the same botanical growth from the same durable summary", () => {
    const first = deriveGardenPlant(summary());
    const second = deriveGardenPlant(summary());

    expect(first).toEqual(second);
    expect(first.stage).toBe("bloom");
  });

  it("keeps an early-ended session visible without punitive growth", () => {
    const garden = deriveGarden([
      summary(),
      summary({
        elapsedMs: 5 * 60_000,
        finishedAtMs: 6 * 60_000,
        finishReason: "ended",
        reflection: "partly",
        sessionId: "session-2",
        subject: "History",
      }),
    ]);

    expect(garden.plants).toHaveLength(2);
    expect(garden.plants[1]).toMatchObject({ sessionId: "session-2", stage: "sprout" });
    expect(garden.plants.every((plant) => plant.growth > 0)).toBe(true);
  });
});
