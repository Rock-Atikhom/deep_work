import type { VisionObservation } from "../awareness/types";

export type VisionReason =
  | "first-use-offline"
  | "runtime-download-failed"
  | "runtime-integrity-failed"
  | "runtime-initialization-failed"
  | "runtime-cancelled"
  | "offline-cache-failed"
  | "calibration-insufficient";

export type VisionWorkerCommand =
  | { type: "PREPARE"; generation: number; manifestUrl: string; releaseId: string }
  | { type: "START_CALIBRATION"; generation: number }
  | {
      type: "FRAME";
      generation: number;
      cameraGeneration: number;
      sequence: number;
      capturedAtMs: number;
      width: number;
      height: number;
      bitmap: ImageBitmap;
    }
  | { type: "CANCEL"; generation: number }
  | { type: "DISPOSE" };

export type VisionWorkerEvent =
  | { type: "PHASE"; generation: number; phase: "verifying" | "initializing" }
  | { type: "READY"; generation: number; releaseId: string; wasmTier: "simd" | "baseline" }
  | { type: "CALIBRATION_PROGRESS"; generation: number; progress: number; sampleCount: number }
  | { type: "CALIBRATION_READY"; generation: number }
  | { type: "OBSERVATION"; generation: number; sequence: number; observation: VisionObservation }
  | { type: "ERROR"; generation: number; code: VisionReason; recoverable: boolean };

const COMMAND_KEYS: Record<VisionWorkerCommand["type"], readonly string[]> = {
  PREPARE: ["type", "generation", "manifestUrl", "releaseId"],
  START_CALIBRATION: ["type", "generation"],
  FRAME: [
    "type",
    "generation",
    "cameraGeneration",
    "sequence",
    "capturedAtMs",
    "width",
    "height",
    "bitmap",
  ],
  CANCEL: ["type", "generation"],
  DISPOSE: ["type"],
};
const EVENT_KEYS: Record<VisionWorkerEvent["type"], readonly string[]> = {
  PHASE: ["type", "generation", "phase"],
  READY: ["type", "generation", "releaseId", "wasmTier"],
  CALIBRATION_PROGRESS: ["type", "generation", "progress", "sampleCount"],
  CALIBRATION_READY: ["type", "generation"],
  OBSERVATION: ["type", "generation", "sequence", "observation"],
  ERROR: ["type", "generation", "code", "recoverable"],
};
const REASONS: readonly VisionReason[] = [
  "first-use-offline",
  "runtime-download-failed",
  "runtime-integrity-failed",
  "runtime-initialization-failed",
  "runtime-cancelled",
  "offline-cache-failed",
  "calibration-insufficient",
];

function exactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    return false;
  const own = Reflect.ownKeys(value);
  return (
    own.length === keys.length && own.every((key) => typeof key === "string" && keys.includes(key))
  );
}
function nonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function finiteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
function score(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}
export function isVisionGeneration(value: unknown): value is number {
  return nonNegativeInt(value);
}
export function isVisionBitmap(value: unknown): value is ImageBitmap {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { close?: unknown }).close === "function"
  );
}
export function closeVisionBitmap(value: unknown): void {
  if (isVisionBitmap(value)) {
    try {
      value.close();
    } catch {
      /* ownership cleanup must not throw */
    }
  }
}
function releaseId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{16}$/.test(value);
}
function safeManifestUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return false;
  try {
    const url = new URL(value, "https://vision.invalid");
    return (
      url.origin === "https://vision.invalid" && url.pathname === value && !url.search && !url.hash
    );
  } catch {
    return false;
  }
}
function observation(value: unknown): value is VisionObservation {
  if (
    !exactObject(value, [
      "capturedAtMs",
      "evidenceQuality",
      "faceCount",
      "gazeDownScore",
      "headAwayScore",
    ])
  )
    return false;
  const item = value as Record<string, unknown>;
  return (
    finiteNonNegative(item.capturedAtMs) &&
    (item.evidenceQuality === "reliable" || item.evidenceQuality === "unreliable") &&
    (item.faceCount === 0 || item.faceCount === 1 || item.faceCount === 2) &&
    score(item.gazeDownScore) &&
    score(item.headAwayScore)
  );
}
export function isVisionWorkerCommand(value: unknown): value is VisionWorkerCommand {
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as { type?: unknown }).type !== "string"
  )
    return false;
  const type = (value as { type: string }).type;
  if (
    !(type in COMMAND_KEYS) ||
    !exactObject(value, COMMAND_KEYS[type as VisionWorkerCommand["type"]])
  )
    return false;
  const item = value as Record<string, unknown>;
  if (type === "DISPOSE") return true;
  if (!nonNegativeInt(item.generation)) return false;
  if (type === "PREPARE") return safeManifestUrl(item.manifestUrl) && releaseId(item.releaseId);
  if (type === "START_CALIBRATION" || type === "CANCEL") return true;
  return (
    nonNegativeInt(item.cameraGeneration) &&
    nonNegativeInt(item.sequence) &&
    finiteNonNegative(item.capturedAtMs) &&
    typeof item.width === "number" &&
    Number.isSafeInteger(item.width) &&
    item.width > 0 &&
    typeof item.height === "number" &&
    Number.isSafeInteger(item.height) &&
    item.height > 0 &&
    isVisionBitmap(item.bitmap)
  );
}
export function isVisionWorkerEvent(value: unknown): value is VisionWorkerEvent {
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as { type?: unknown }).type !== "string"
  )
    return false;
  const type = (value as { type: string }).type;
  if (!(type in EVENT_KEYS) || !exactObject(value, EVENT_KEYS[type as VisionWorkerEvent["type"]]))
    return false;
  const item = value as Record<string, unknown>;
  if (!nonNegativeInt(item.generation)) return false;
  if (type === "PHASE") return item.phase === "verifying" || item.phase === "initializing";
  if (type === "READY")
    return releaseId(item.releaseId) && (item.wasmTier === "simd" || item.wasmTier === "baseline");
  if (type === "CALIBRATION_PROGRESS")
    return score(item.progress) && nonNegativeInt(item.sampleCount);
  if (type === "CALIBRATION_READY") return true;
  if (type === "OBSERVATION") return nonNegativeInt(item.sequence) && observation(item.observation);
  return REASONS.includes(item.code as VisionReason) && typeof item.recoverable === "boolean";
}
