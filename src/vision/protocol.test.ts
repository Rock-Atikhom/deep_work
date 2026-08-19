import { describe, expect, it, vi } from "vitest";
import type { VisionObservation } from "../awareness/types";
import {
  isVisionGeneration,
  isVisionWorkerCommand,
  isVisionWorkerEvent,
  type VisionWorkerCommand,
  type VisionWorkerEvent,
} from "./protocol";

const observation: VisionObservation = {
  capturedAtMs: 1_500,
  evidenceQuality: "reliable",
  faceCount: 1,
  gazeDownScore: 0.72,
  headAwayScore: 0.18,
};

function bitmap() {
  return { close: vi.fn() } as unknown as ImageBitmap;
}

describe("vision worker protocol", () => {
  it("accepts the exact local worker command and event union", () => {
    const commands: VisionWorkerCommand[] = [
      {
        type: "PREPARE",
        generation: 1,
        manifestUrl: "/vision/manifest.json",
        releaseId: "0123456789abcdef",
      },
      { type: "START_CALIBRATION", generation: 1 },
      {
        type: "FRAME",
        generation: 1,
        cameraGeneration: 2,
        sequence: 3,
        capturedAtMs: 1_500,
        width: 640,
        height: 360,
        bitmap: bitmap(),
      },
      { type: "CANCEL", generation: 1 },
      { type: "DISPOSE" },
    ];
    const events: VisionWorkerEvent[] = [
      { type: "PHASE", generation: 1, phase: "verifying" },
      { type: "READY", generation: 1, releaseId: "0123456789abcdef", wasmTier: "simd" },
      { type: "CALIBRATION_PROGRESS", generation: 1, progress: 0.5, sampleCount: 8 },
      { type: "CALIBRATION_READY", generation: 1 },
      { type: "OBSERVATION", generation: 1, sequence: 3, observation },
      { type: "ERROR", generation: 1, code: "runtime-initialization-failed", recoverable: true },
    ];

    expect(commands.every(isVisionWorkerCommand)).toBe(true);
    expect(events.every(isVisionWorkerEvent)).toBe(true);
  });

  it.each([
    ["negative generation", { type: "CANCEL", generation: -1 }],
    ["fractional generation", { type: "START_CALIBRATION", generation: 1.2 }],
    ["unknown command key", { type: "DISPOSE", unsafe: true }],
    [
      "unsafe manifest path",
      {
        type: "PREPARE",
        generation: 1,
        manifestUrl: "https://remote.invalid/m.json",
        releaseId: "0123456789abcdef",
      },
    ],
    [
      "malformed bitmap",
      {
        type: "FRAME",
        generation: 1,
        cameraGeneration: 0,
        sequence: 0,
        capturedAtMs: 10,
        width: 640,
        height: 360,
        bitmap: {},
      },
    ],
  ])("rejects %s", (_name, value) => {
    expect(isVisionWorkerCommand(value)).toBe(false);
  });

  it.each([
    [
      "out-of-range gaze score",
      {
        type: "OBSERVATION",
        generation: 1,
        sequence: 1,
        observation: { ...observation, gazeDownScore: 1.1 },
      },
    ],
    [
      "non-finite timestamp",
      {
        type: "OBSERVATION",
        generation: 1,
        sequence: 1,
        observation: { ...observation, capturedAtMs: Number.NaN },
      },
    ],
    ["unknown reason", { type: "ERROR", generation: 1, code: "raw-landmarks", recoverable: true }],
    [
      "unknown event key",
      {
        type: "READY",
        generation: 1,
        releaseId: "0123456789abcdef",
        wasmTier: "simd",
        unsafe: true,
      },
    ],
    [
      "progress above one",
      { type: "CALIBRATION_PROGRESS", generation: 1, progress: 1.2, sampleCount: 15 },
    ],
  ])("rejects %s", (_name, value) => {
    expect(isVisionWorkerEvent(value)).toBe(false);
  });

  it("accepts only safe non-negative integer generations", () => {
    expect(isVisionGeneration(0)).toBe(true);
    expect(isVisionGeneration(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(isVisionGeneration(-1)).toBe(false);
    expect(isVisionGeneration(1.5)).toBe(false);
    expect(isVisionGeneration(Number.NaN)).toBe(false);
  });
});
