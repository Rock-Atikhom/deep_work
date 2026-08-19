import { describe, expect, it } from "vitest";
import {
  CALIBRATION_DURATION_MS,
  MIN_CALIBRATION_SAMPLES,
  addCalibrationSample,
  createCalibrationState,
  resetCalibration,
  type CalibrationSample,
} from "./calibration";

function sample(overrides: Partial<CalibrationSample> = {}): CalibrationSample {
  return {
    faceCenterX: 0.5,
    faceCenterY: 0.45,
    faceHeight: 0.5,
    faceWidth: 0.32,
    headPitch: 0.02,
    headYaw: -0.01,
    leftIrisVerticalRatio: 0.5,
    rightIrisVerticalRatio: 0.5,
    confidence: 0.95,
    ...overrides,
  };
}

describe("worker-local calibration", () => {
  it("requires reliable single-face samples and a bounded three-second window", () => {
    let state = createCalibrationState(4, 0);
    const unreliable = addCalibrationSample(state, sample({ confidence: 0.1 }), 100);
    expect(unreliable.accepted).toBe(false);
    expect(unreliable.state.sampleCount).toBe(0);

    for (let index = 0; index < MIN_CALIBRATION_SAMPLES; index += 1) {
      const result = addCalibrationSample(state, sample(), index * 220);
      state = result.state;
    }
    expect(state.baseline).toBeNull();

    const completed = addCalibrationSample(state, sample(), CALIBRATION_DURATION_MS);
    expect(completed.accepted).toBe(true);
    expect(completed.ready).toBe(true);
    expect(completed.state.baseline).toMatchObject({
      headPitch: 0.02,
      headYaw: -0.01,
      leftIrisVerticalRatio: 0.5,
      rightIrisVerticalRatio: 0.5,
    });
  });

  it("rejects non-finite samples and erases all calibration data on reset", () => {
    let state = createCalibrationState(8, 0);
    const rejected = addCalibrationSample(state, sample({ headYaw: Number.NaN }), 10);
    expect(rejected.accepted).toBe(false);
    state = addCalibrationSample(state, sample(), 10).state;
    expect(state.samples).toHaveLength(1);
    const reset = resetCalibration(state, 9, 2_000);
    expect(reset).toMatchObject({ generation: 9, sampleCount: 0, baseline: null });
    expect(reset.samples).toHaveLength(0);
  });
});
