import { describe, expect, it } from "vitest";
import { advanceAwareness, createAwarenessPolicy } from "./awareness-policy";
import { PRESETS } from "./presets";
import type { VisionObservation } from "./types";

const reliable = (
  capturedAtMs: number,
  gazeDownScore: number,
  headAwayScore = 0.1,
): VisionObservation => ({
  capturedAtMs,
  evidenceQuality: "reliable",
  faceCount: 1,
  gazeDownScore,
  headAwayScore,
});

describe("awareness policy", () => {
  it("emits a balanced gaze event only after the five-second dwell", () => {
    let policy = createAwarenessPolicy("balanced");
    policy = advanceAwareness(policy, reliable(0, 0.9)).state;
    const before = advanceAwareness(policy, reliable(4_999, 0.9));
    expect(before.event).toBeNull();
    const atThreshold = advanceAwareness(before.state, reliable(5_000, 0.9));
    expect(atThreshold.event?.signal).toBe("gaze-down");
  });

  it("requires recovery before another event and ignores unreliable evidence", () => {
    let policy = createAwarenessPolicy("balanced");
    policy = advanceAwareness(policy, reliable(0, 0.9)).state;
    policy = advanceAwareness(policy, reliable(5_000, 0.9)).state;
    expect(advanceAwareness(policy, reliable(30_001, 0.9)).event).toBeNull();
    expect(
      advanceAwareness(policy, { ...reliable(31_000, 0.1), evidenceQuality: "unreliable" }).event,
    ).toBeNull();
    policy = advanceAwareness(policy, reliable(31_000, 0.1)).state;
    const recovered = advanceAwareness(policy, reliable(33_000, 0.1));
    expect(recovered.event).toBeNull();
    policy = advanceAwareness(recovered.state, reliable(33_001, 0.9)).state;
    const second = advanceAwareness(policy, reliable(38_001, 0.9));
    expect(second.event?.signal).toBe("gaze-down");
  });

  it("does not start face absence until a reliable face was seen", () => {
    let policy = createAwarenessPolicy("balanced");
    const initial = advanceAwareness(policy, { ...reliable(0, 0), faceCount: 0 });
    expect(initial.event).toBeNull();
    policy = initial.state;
    policy = advanceAwareness(policy, reliable(1, 0)).state;
    const absent = advanceAwareness(policy, { ...reliable(20_001, 0), faceCount: 0 });
    expect(absent.event?.signal).toBe("face-absent");
  });

  it("keeps the documented immutable preset thresholds", () => {
    expect(PRESETS).toMatchObject({
      gentle: { awayMs: 10_000, absentMs: 20_000, cooldownMs: 60_000 },
      balanced: { awayMs: 5_000, absentMs: 10_000, cooldownMs: 30_000 },
      strict: { awayMs: 3_000, absentMs: 5_000, cooldownMs: 15_000 },
    });
  });
});
