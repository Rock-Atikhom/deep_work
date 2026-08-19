import type { VisionObservation } from "../awareness/types";
import type { CalibrationBaseline } from "./calibration";

export const FACE_CONFIDENCE_MIN = 0.6;
const MIN_FACE_WIDTH = 0.12;
const MIN_FACE_HEIGHT = 0.18;
const MAX_FACE_HEIGHT = 0.95;
const GAZE_SCALE = 0.2;
const HEAD_SCALE = 0.35;
export type ObservationFrame = {
  capturedAtMs: number;
  confidence: number;
  faceCenterX: number;
  faceCenterY: number;
  faceCount: number;
  faceHeight: number;
  faceWidth: number;
  headPitch: number | undefined;
  headYaw: number | undefined;
  leftIrisVerticalRatio: number | undefined;
  rightIrisVerticalRatio: number | undefined;
  baseline: CalibrationBaseline;
};
function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}
function reliable(frame: ObservationFrame): boolean {
  return (
    frame.faceCount === 1 &&
    frame.confidence >= FACE_CONFIDENCE_MIN &&
    frame.faceCenterX >= 0.15 &&
    frame.faceCenterX <= 0.85 &&
    frame.faceCenterY >= 0.1 &&
    frame.faceCenterY <= 0.9 &&
    frame.faceWidth >= MIN_FACE_WIDTH &&
    frame.faceHeight >= MIN_FACE_HEIGHT &&
    frame.faceHeight <= MAX_FACE_HEIGHT &&
    frame.headYaw !== undefined &&
    frame.headPitch !== undefined &&
    frame.leftIrisVerticalRatio !== undefined &&
    frame.rightIrisVerticalRatio !== undefined &&
    Object.values(frame)
      .filter((value) => typeof value === "number")
      .every((value) => Number.isFinite(value))
  );
}
export function normalizeObservation(frame: ObservationFrame): VisionObservation {
  const faceCount: 0 | 1 | 2 = frame.faceCount === 1 || frame.faceCount === 2 ? frame.faceCount : 0;
  if (!reliable(frame))
    return {
      capturedAtMs: frame.capturedAtMs,
      evidenceQuality: "unreliable",
      faceCount,
      gazeDownScore: 0,
      headAwayScore: 0,
    };
  const gazeDelta =
    (Math.abs(frame.leftIrisVerticalRatio! - frame.baseline.leftIrisVerticalRatio) +
      Math.abs(frame.rightIrisVerticalRatio! - frame.baseline.rightIrisVerticalRatio)) /
    2;
  const headDelta = Math.hypot(
    frame.headYaw! - frame.baseline.headYaw,
    frame.headPitch! - frame.baseline.headPitch,
  );
  return {
    capturedAtMs: frame.capturedAtMs,
    evidenceQuality: "reliable",
    faceCount: 1,
    gazeDownScore: clamp(gazeDelta / GAZE_SCALE),
    headAwayScore: clamp(headDelta / HEAD_SCALE),
  };
}
