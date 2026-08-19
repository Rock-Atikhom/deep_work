export const CALIBRATION_DURATION_MS = 3_000;
export const MIN_CALIBRATION_SAMPLES = 15;
const MAX_CALIBRATION_SAMPLES = 120;

export type CalibrationSample = {
  faceCenterX: number;
  faceCenterY: number;
  faceHeight: number;
  faceWidth: number;
  headPitch: number;
  headYaw: number;
  leftIrisVerticalRatio: number;
  rightIrisVerticalRatio: number;
  confidence: number;
};
export type CalibrationBaseline = Omit<CalibrationSample, "confidence">;
export type CalibrationState = {
  generation: number;
  startedAtMs: number;
  samples: CalibrationSample[];
  sampleCount: number;
  baseline: CalibrationBaseline | null;
  ready: boolean;
};
export function createCalibrationState(generation: number, startedAtMs = 0): CalibrationState {
  return { generation, startedAtMs, samples: [], sampleCount: 0, baseline: null, ready: false };
}
export function resetCalibration(
  _state: CalibrationState,
  generation: number,
  startedAtMs = 0,
): CalibrationState {
  return createCalibrationState(generation, startedAtMs);
}
function validSample(sample: CalibrationSample): boolean {
  return (
    Object.values(sample).every((value) => typeof value === "number" && Number.isFinite(value)) &&
    sample.confidence >= 0.5 &&
    sample.faceCenterX >= 0 &&
    sample.faceCenterX <= 1 &&
    sample.faceCenterY >= 0 &&
    sample.faceCenterY <= 1 &&
    sample.faceWidth > 0 &&
    sample.faceHeight > 0
  );
}
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}
function baselineFrom(samples: CalibrationSample[]): CalibrationBaseline {
  const field = (key: keyof CalibrationBaseline) => median(samples.map((sample) => sample[key]));
  return {
    faceCenterX: field("faceCenterX"),
    faceCenterY: field("faceCenterY"),
    faceHeight: field("faceHeight"),
    faceWidth: field("faceWidth"),
    headPitch: field("headPitch"),
    headYaw: field("headYaw"),
    leftIrisVerticalRatio: field("leftIrisVerticalRatio"),
    rightIrisVerticalRatio: field("rightIrisVerticalRatio"),
  };
}
export function calibrationProgress(state: CalibrationState, timestampMs: number): number {
  return Math.min(1, Math.max(0, (timestampMs - state.startedAtMs) / CALIBRATION_DURATION_MS));
}
export function addCalibrationSample(
  state: CalibrationState,
  sample: CalibrationSample,
  timestampMs: number,
): { state: CalibrationState; accepted: boolean; ready: boolean; progress: number } {
  if (
    state.ready ||
    !validSample(sample) ||
    timestampMs < state.startedAtMs ||
    timestampMs > state.startedAtMs + CALIBRATION_DURATION_MS
  )
    return {
      state,
      accepted: false,
      ready: state.ready,
      progress: calibrationProgress(state, timestampMs),
    };
  const samples = [...state.samples, sample].slice(-MAX_CALIBRATION_SAMPLES);
  const sampleCount = state.sampleCount + 1;
  const progress = calibrationProgress(state, timestampMs);
  const ready = sampleCount >= MIN_CALIBRATION_SAMPLES && progress >= 1;
  const next: CalibrationState = {
    ...state,
    samples: ready ? [] : samples,
    sampleCount,
    baseline: ready ? baselineFrom(samples) : null,
    ready,
  };
  return { state: next, accepted: true, ready, progress };
}

export type FaceLandmarkPoint = { x: number; y: number; z?: number };
export function headPoseFromMatrix(
  matrix: readonly number[] | { data: readonly number[] },
): { headPitch: number; headYaw: number } | null {
  const values: readonly number[] = "data" in matrix ? matrix.data : matrix;
  if (values.length < 16 || !values.slice(0, 16).every(Number.isFinite)) return null;
  const yaw = Math.atan2(values[2]!, values[10]!);
  const pitch = Math.atan2(-values[6]!, Math.hypot(values[4]!, values[8]!));
  return { headPitch: pitch, headYaw: yaw };
}
export function calibrationSampleFromLandmarks(
  landmarks: readonly FaceLandmarkPoint[],
  matrix: readonly number[] | { data: readonly number[] },
  confidence: number,
): CalibrationSample | null {
  const required = [468, 159, 145, 473, 386, 374];
  if (
    landmarks.length <= Math.max(...required) ||
    !required.every(
      (index) => Number.isFinite(landmarks[index]?.x) && Number.isFinite(landmarks[index]?.y),
    )
  )
    return null;
  const pose = headPoseFromMatrix(matrix);
  if (!pose) return null;
  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const left = landmarks[468]!,
    right = landmarks[473]!;
  return {
    faceCenterX: (minX + maxX) / 2,
    faceCenterY: (minY + maxY) / 2,
    faceWidth: maxX - minX,
    faceHeight: maxY - minY,
    headPitch: pose.headPitch,
    headYaw: pose.headYaw,
    leftIrisVerticalRatio: (left.y - landmarks[159]!.y) / (landmarks[145]!.y - landmarks[159]!.y),
    rightIrisVerticalRatio: (right.y - landmarks[386]!.y) / (landmarks[374]!.y - landmarks[386]!.y),
    confidence,
  };
}
