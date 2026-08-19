import type { VisionObservation } from "../awareness/types";
import { VISION_MANIFEST, VISION_MANIFEST_URL } from "./release";
import { isVisionWorkerEvent, type VisionReason, type VisionWorkerCommand } from "./protocol";

export interface VisionWorkerPort {
  postMessage(message: VisionWorkerCommand, transfer?: Transferable[]): void;
  terminate(): void;
  addEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
}
export type VisionRuntimeSnapshot = {
  generation: number;
  phase: "idle" | "preparing" | "calibrating" | "ready" | "error";
  calibrationProgress: number;
  lastObservation: VisionObservation | null;
  errorCode: VisionReason | null;
};
export interface VisionClient {
  readonly snapshot: VisionRuntimeSnapshot;
  prepare(): Promise<void>;
  startCalibration(): void;
  submitFrame(
    bitmap: ImageBitmap,
    meta: { cameraGeneration: number; capturedAtMs: number; width: number; height: number },
  ): boolean;
  cancel(): void;
  dispose(): void;
  subscribe(listener: (snapshot: VisionRuntimeSnapshot) => void): () => void;
}
export type VisionClientOptions = {
  createWorker?: () => VisionWorkerPort;
  manifest?: typeof VISION_MANIFEST;
  manifestUrl?: string;
};
function closeBitmap(bitmap: ImageBitmap): void {
  try {
    bitmap.close();
  } catch {
    /* ownership cleanup */
  }
}
function frozen(snapshot: VisionRuntimeSnapshot): VisionRuntimeSnapshot {
  return Object.freeze(snapshot);
}
export function createVisionClient(options: VisionClientOptions = {}): VisionClient {
  const createWorker =
    options.createWorker ??
    (() =>
      new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      }) as unknown as VisionWorkerPort);
  const manifest = options.manifest ?? VISION_MANIFEST;
  const manifestUrl = options.manifestUrl ?? VISION_MANIFEST_URL;
  let current: VisionRuntimeSnapshot = frozen({
    generation: 0,
    phase: "idle",
    calibrationProgress: 0,
    lastObservation: null,
    errorCode: null,
  });
  let worker: VisionWorkerPort | null = null;
  let sequence = 0;
  let lastSequence = -1;
  let disposed = false;
  const listeners = new Set<(snapshot: VisionRuntimeSnapshot) => void>();
  let pending: {
    generation: number;
    resolve: () => void;
    reject: (error: Error) => void;
    retried: boolean;
  } | null = null;
  const emit = (patch: Partial<VisionRuntimeSnapshot>) => {
    current = frozen({ ...current, ...patch });
    listeners.forEach((listener) => listener(current));
  };
  const detach = () => {
    if (!worker) return;
    worker.removeEventListener("message", onMessage);
  };
  const create = () => {
    worker = createWorker();
    worker.addEventListener("message", onMessage);
  };
  const send = (message: VisionWorkerCommand, transfer?: Transferable[]) => {
    if (!worker) return false;
    try {
      worker.postMessage(message, transfer);
      return true;
    } catch {
      return false;
    }
  };
  function onMessage(event: MessageEvent<unknown>): void {
    if (!isVisionWorkerEvent(event.data) || disposed) return;
    const message = event.data;
    if (message.generation !== current.generation) return;
    if (message.type === "PHASE") emit({ phase: "preparing" });
    else if (message.type === "READY") {
      if (message.releaseId !== manifest.releaseId) {
        emit({ phase: "error", errorCode: "runtime-integrity-failed" });
        if (pending?.generation === message.generation) {
          const reject = pending.reject;
          pending = null;
          reject(new Error("runtime-integrity-failed"));
        }
        return;
      }
      emit({ phase: "ready", calibrationProgress: 0, errorCode: null });
      if (pending?.generation === message.generation) {
        const resolve = pending.resolve;
        pending = null;
        resolve();
      }
    } else if (message.type === "CALIBRATION_PROGRESS")
      emit({ phase: "calibrating", calibrationProgress: message.progress });
    else if (message.type === "CALIBRATION_READY") emit({ phase: "ready", calibrationProgress: 1 });
    else if (message.type === "OBSERVATION") {
      if (message.sequence > lastSequence) {
        lastSequence = message.sequence;
        emit({ lastObservation: message.observation });
      }
    } else {
      if (pending?.generation === message.generation && !pending.retried) {
        pending.retried = true;
        if (worker) {
          detach();
          worker.terminate();
        }
        try {
          create();
        } catch {
          const reject = pending.reject;
          pending = null;
          emit({ phase: "error", errorCode: "runtime-initialization-failed" });
          reject(new Error("Unable to restart vision worker"));
          return;
        }
        const generation = current.generation + 1;
        pending.generation = generation;
        sequence = 0;
        lastSequence = -1;
        emit({
          generation,
          phase: "preparing",
          calibrationProgress: 0,
          lastObservation: null,
          errorCode: null,
        });
        if (!send({ type: "PREPARE", generation, manifestUrl, releaseId: manifest.releaseId })) {
          const reject = pending.reject;
          pending = null;
          emit({ phase: "error", errorCode: "runtime-initialization-failed" });
          reject(new Error("Unable to restart vision worker"));
        }
        return;
      }
      emit({ phase: "error", errorCode: message.code });
      if (pending?.generation === message.generation) {
        const reject = pending.reject;
        pending = null;
        reject(new Error(message.code));
      }
    }
  }
  return {
    get snapshot() {
      return current;
    },
    prepare() {
      if (disposed) return Promise.reject(new Error("Vision client disposed"));
      if (pending)
        return new Promise<void>((resolve, reject) => {
          const existing = pending!;
          const originalResolve = existing.resolve;
          const originalReject = existing.reject;
          existing.resolve = () => {
            originalResolve();
            resolve();
          };
          existing.reject = (error) => {
            originalReject(error);
            reject(error);
          };
        });
      if (worker) {
        detach();
        worker.terminate();
      }
      create();
      sequence = 0;
      lastSequence = -1;
      const generation = current.generation + 1;
      emit({
        generation,
        phase: "preparing",
        calibrationProgress: 0,
        lastObservation: null,
        errorCode: null,
      });
      return new Promise<void>((resolve, reject) => {
        pending = { generation, resolve, reject, retried: false };
        if (!send({ type: "PREPARE", generation, manifestUrl, releaseId: manifest.releaseId })) {
          pending = null;
          reject(new Error("Unable to start vision worker"));
        }
      });
    },
    startCalibration() {
      if (worker && (current.phase === "ready" || current.phase === "calibrating")) {
        emit({ phase: "calibrating", calibrationProgress: 0 });
        send({ type: "START_CALIBRATION", generation: current.generation });
      }
    },
    submitFrame(bitmap, meta) {
      if (
        !worker ||
        (current.phase !== "ready" && current.phase !== "calibrating") ||
        !Number.isSafeInteger(meta.cameraGeneration) ||
        meta.cameraGeneration < 0 ||
        !Number.isFinite(meta.capturedAtMs) ||
        meta.capturedAtMs < 0 ||
        !Number.isSafeInteger(meta.width) ||
        meta.width <= 0 ||
        !Number.isSafeInteger(meta.height) ||
        meta.height <= 0
      ) {
        closeBitmap(bitmap);
        return false;
      }
      const command: Extract<VisionWorkerCommand, { type: "FRAME" }> = {
        type: "FRAME",
        generation: current.generation,
        cameraGeneration: meta.cameraGeneration,
        sequence: sequence++,
        capturedAtMs: meta.capturedAtMs,
        width: meta.width,
        height: meta.height,
        bitmap,
      };
      if (!send(command, [bitmap])) {
        closeBitmap(bitmap);
        return false;
      }
      return true;
    },
    cancel() {
      if (worker && current.generation > 0) {
        send({ type: "CANCEL", generation: current.generation });
        emit({ phase: "idle", calibrationProgress: 0 });
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (worker) {
        send({ type: "DISPOSE" });
        detach();
        worker.terminate();
        worker = null;
      }
      if (pending) {
        pending.reject(new Error("Vision client disposed"));
        pending = null;
      }
      listeners.clear();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
