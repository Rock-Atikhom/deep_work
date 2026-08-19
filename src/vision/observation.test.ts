import { describe, expect, it } from "vitest";
import { type CalibrationBaseline } from "./calibration";
import { FACE_CONFIDENCE_MIN, normalizeObservation, type ObservationFrame } from "./observation";

const baseline: CalibrationBaseline = {
  faceCenterX: 0.5,
  faceCenterY: 0.45,
  faceHeight: 0.5,
  faceWidth: 0.32,
  headPitch: 0,
  headYaw: 0,
  leftIrisVerticalRatio: 0.5,
  rightIrisVerticalRatio: 0.5,
};

function frame(overrides: Partial<ObservationFrame> = {}): ObservationFrame {
  return {
    capturedAtMs: 5_000,
    confidence: FACE_CONFIDENCE_MIN + 0.1,
    faceCenterX: 0.5,
    faceCenterY: 0.45,
    faceCount: 1,
    faceHeight: 0.5,
    faceWidth: 0.32,
    headPitch: 0,
    headYaw: 0,
    leftIrisVerticalRatio: 0.5,
    rightIrisVerticalRatio: 0.5,
    baseline,
    ...overrides,
  };
}

describe("normalized local observations", () => {
  it("maps calibrated deviation to clamped gaze and head scores", () => {
    const observation = normalizeObservation(frame({ headYaw: 0.5, leftIrisVerticalRatio: 0.9 }));
    expect(observation).toMatchObject({
      capturedAtMs: 5_000,
      evidenceQuality: "reliable",
      faceCount: 1,
    });
    expect(observation.gazeDownScore).toBeGreaterThan(0);
    expect(observation.headAwayScore).toBeGreaterThan(0);
    expect(observation.gazeDownScore).toBeLessThanOrEqual(1);
    expect(observation.headAwayScore).toBeLessThanOrEqual(1);
  });

  it.each([
    ["no face", { faceCount: 0 }],
    ["multiple faces", { faceCount: 2 }],
    ["low confidence", { confidence: FACE_CONFIDENCE_MIN - 0.01 }],
    ["face too far left", { faceCenterX: 0.05 }],
    ["missing head pose", { headYaw: undefined }],
  ])("marks %s as unreliable", (_name, overrides) => {
    const observation = normalizeObservation(frame(overrides));
    expect(observation.evidenceQuality).toBe("unreliable");
    expect(observation.gazeDownScore).toBe(0);
    expect(observation.headAwayScore).toBe(0);
  });
});
