import type { VisionWorkerCommand, VisionWorkerEvent } from "./protocol";
import { closeVisionBitmap, isVisionWorkerCommand } from "./protocol";
import {
  addCalibrationSample,
  calibrationSampleFromLandmarks,
  createCalibrationState,
  resetCalibration,
  type CalibrationState,
} from "./calibration";
import { normalizeObservation, type ObservationFrame } from "./observation";
import {
  prepareVisionRuntime,
  type PreparedVisionRuntime,
  type PrepareVisionRuntimeInput,
  type VisionRuntimeDependencies,
} from "./runtime-loader";

type LandmarkerResultLike = {
  faceLandmarks?: readonly (readonly { x: number; y: number; z?: number }[])[];
  facialTransformationMatrixes?: readonly (readonly number[] | { data: readonly number[] })[];
};
type Active = {
  generation: number;
  controller: AbortController;
  prepared: PreparedVisionRuntime | null;
  calibration: CalibrationState;
  calibrating: boolean;
  inferenceErrorPosted: boolean;
};
export type VisionWorkerRuntimeOverrides = {
  prepareRuntime?: (
    input: PrepareVisionRuntimeInput,
    dependencies: VisionRuntimeDependencies,
  ) => Promise<PreparedVisionRuntime>;
};
export type VisionWorkerRuntime = { receive(value: unknown): void; dispose(): void };

function post(postMessage: (event: VisionWorkerEvent) => void, event: VisionWorkerEvent): void {
  postMessage(event);
}
function errorCode(
  error: unknown,
):
  | "runtime-download-failed"
  | "runtime-integrity-failed"
  | "runtime-initialization-failed"
  | "runtime-cancelled"
  | "offline-cache-failed" {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (
      code === "runtime-download-failed" ||
      code === "runtime-integrity-failed" ||
      code === "runtime-cancelled" ||
      code === "offline-cache-failed"
    )
      return code;
  }
  return "runtime-initialization-failed";
}
function closeActive(active: Active | null): void {
  if (!active) return;
  active.controller.abort();
  active.prepared?.close();
  active.prepared = null;
  active.calibration = resetCalibration(active.calibration, active.generation);
  active.calibrating = false;
}
function frameFromResult(
  result: LandmarkerResultLike,
  capturedAtMs: number,
  baseline: NonNullable<CalibrationState["baseline"]>,
): ObservationFrame | null {
  const faceCount: 0 | 1 | 2 =
    result.faceLandmarks?.length === 1 ? 1 : result.faceLandmarks?.length === 2 ? 2 : 0;
  const landmarks = result.faceLandmarks?.[0];
  const matrix = result.facialTransformationMatrixes?.[0];
  if (!landmarks || !matrix || faceCount !== 1) {
    return {
      capturedAtMs,
      confidence: 0,
      faceCenterX: 0.5,
      faceCenterY: 0.5,
      faceCount,
      faceHeight: 0,
      faceWidth: 0,
      headPitch: undefined,
      headYaw: undefined,
      leftIrisVerticalRatio: undefined,
      rightIrisVerticalRatio: undefined,
      baseline,
    };
  }
  const sample = calibrationSampleFromLandmarks(landmarks, matrix, 1);
  if (!sample) {
    return {
      capturedAtMs,
      confidence: 0,
      faceCenterX: 0.5,
      faceCenterY: 0.5,
      faceCount: 1,
      faceHeight: 0,
      faceWidth: 0,
      headPitch: undefined,
      headYaw: undefined,
      leftIrisVerticalRatio: undefined,
      rightIrisVerticalRatio: undefined,
      baseline,
    };
  }
  return {
    ...sample,
    capturedAtMs,
    faceCount,
    baseline,
  };
}

export function createVisionWorkerRuntime(
  dependencies: VisionRuntimeDependencies,
  postMessage: (event: VisionWorkerEvent) => void,
  overrides: VisionWorkerRuntimeOverrides = {},
): VisionWorkerRuntime {
  let active: Active | null = null;
  let disposed = false;
  const cancelActive = () => {
    closeActive(active);
    active = null;
  };
  const receivePrepare = (command: Extract<VisionWorkerCommand, { type: "PREPARE" }>) => {
    if (disposed || (active && command.generation < active.generation)) return;
    cancelActive();
    const current: Active = {
      generation: command.generation,
      controller: new AbortController(),
      prepared: null,
      calibration: createCalibrationState(command.generation),
      calibrating: false,
      inferenceErrorPosted: false,
    };
    active = current;
    const input: PrepareVisionRuntimeInput = {
      manifestUrl: command.manifestUrl,
      releaseId: command.releaseId,
      signal: current.controller.signal,
      onPhase: (phase) => {
        if (active === current)
          post(postMessage, { type: "PHASE", generation: current.generation, phase });
      },
    };
    void (
      overrides.prepareRuntime
        ? overrides.prepareRuntime(input, dependencies)
        : prepareVisionRuntime(input, dependencies)
    )
      .then((runtime) => {
        if (disposed || active !== current || current.controller.signal.aborted) {
          runtime.close();
          return;
        }
        current.prepared = runtime;
        post(postMessage, {
          type: "READY",
          generation: current.generation,
          releaseId: command.releaseId,
          wasmTier: runtime.wasmTier,
        });
      })
      .catch((error: unknown) => {
        if (active !== current || disposed) return;
        const code = errorCode(error);
        post(postMessage, {
          type: "ERROR",
          generation: current.generation,
          code,
          recoverable: code !== "runtime-integrity-failed",
        });
      });
  };
  const receiveFrame = (command: Extract<VisionWorkerCommand, { type: "FRAME" }>) => {
    const frame = command.bitmap;
    if (disposed || !active || active.generation !== command.generation || !active.prepared) {
      closeVisionBitmap(frame);
      return;
    }
    const current = active;
    const runtime = current.prepared;
    if (!runtime) {
      closeVisionBitmap(frame);
      return;
    }
    void Promise.resolve()
      .then(() => runtime.detectForVideo(frame, command.capturedAtMs) as LandmarkerResultLike)
      .then((result) => {
        if (active !== current || disposed) return;
        const landmarks = result.faceLandmarks?.[0];
        const matrix = result.facialTransformationMatrixes?.[0];
        if (current.calibration.baseline === null && current.calibrating) {
          if (current.calibration.sampleCount === 0) {
            current.calibration = resetCalibration(
              current.calibration,
              current.generation,
              command.capturedAtMs,
            );
          }
          if (!landmarks || !matrix) return;
          const sample = calibrationSampleFromLandmarks(landmarks, matrix, 1);
          if (!sample) return;
          const calibration = addCalibrationSample(
            current.calibration,
            sample,
            command.capturedAtMs,
          );
          current.calibration = calibration.state;
          post(postMessage, {
            type: "CALIBRATION_PROGRESS",
            generation: current.generation,
            progress: calibration.progress,
            sampleCount: calibration.state.sampleCount,
          });
          if (calibration.ready) {
            current.calibrating = false;
            post(postMessage, { type: "CALIBRATION_READY", generation: current.generation });
          }
          return;
        }
        if (current.calibration.baseline === null) return;
        const observationFrame = frameFromResult(
          result,
          command.capturedAtMs,
          current.calibration.baseline,
        );
        if (observationFrame)
          post(postMessage, {
            type: "OBSERVATION",
            generation: current.generation,
            sequence: command.sequence,
            observation: normalizeObservation(observationFrame),
          });
      })
      .catch(() => {
        if (active === current && !disposed && !current.inferenceErrorPosted) {
          current.inferenceErrorPosted = true;
          post(postMessage, {
            type: "ERROR",
            generation: current.generation,
            code: "runtime-initialization-failed",
            recoverable: true,
          });
        }
      })
      .finally(() => closeVisionBitmap(frame));
  };
  return {
    receive(value) {
      if (disposed) {
        if (
          typeof value === "object" &&
          value !== null &&
          (value as { type?: unknown }).type === "FRAME"
        )
          closeVisionBitmap((value as { bitmap?: unknown }).bitmap);
        return;
      }
      if (!isVisionWorkerCommand(value)) {
        if (
          typeof value === "object" &&
          value !== null &&
          (value as { type?: unknown }).type === "FRAME"
        )
          closeVisionBitmap((value as { bitmap?: unknown }).bitmap);
        return;
      }
      if (value.type === "PREPARE") receivePrepare(value);
      else if (value.type === "FRAME") receiveFrame(value);
      else if (value.type === "START_CALIBRATION") {
        if (active?.generation === value.generation && active.prepared) {
          active.calibration = resetCalibration(active.calibration, value.generation, Date.now());
          active.calibrating = true;
        }
      } else if (value.type === "CANCEL") {
        if (active?.generation === value.generation) {
          closeActive(active);
          active = null;
        }
      } else {
        cancelActive();
        disposed = true;
      }
    },
    dispose() {
      if (!disposed) {
        cancelActive();
        disposed = true;
      }
    },
  };
}
