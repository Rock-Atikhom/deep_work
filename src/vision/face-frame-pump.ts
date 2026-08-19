import type { VisionWorkerCommand } from "./protocol";
import { closeVisionBitmap } from "./protocol";

export type FaceFramePumpTick = {
  generation: number;
  cameraGeneration: number;
  width: number;
  height: number;
};
export type FaceFramePumpDependencies = {
  capture: (size: { width: number; height: number }) => Promise<ImageBitmap>;
  now: () => number;
  submit: (command: Extract<VisionWorkerCommand, { type: "FRAME" }>) => boolean;
};
export type FaceFramePump = {
  tick(input: FaceFramePumpTick): Promise<boolean>;
  stop(): void;
  dispose(): void;
};
const MAX_FRAME_SIZE = 640;
function boundedSize(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, MAX_FRAME_SIZE / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
export function createFaceFramePump(dependencies: FaceFramePumpDependencies): FaceFramePump {
  let inFlight = false;
  let epoch = 0;
  let sequence = 0;
  let disposed = false;
  return {
    async tick(input) {
      if (disposed || inFlight) return false;
      inFlight = true;
      const captureEpoch = epoch;
      try {
        const frame = await dependencies.capture(boundedSize(input.width, input.height));
        if (disposed || captureEpoch !== epoch) {
          closeVisionBitmap(frame);
          return false;
        }
        const command: Extract<VisionWorkerCommand, { type: "FRAME" }> = {
          type: "FRAME",
          generation: input.generation,
          cameraGeneration: input.cameraGeneration,
          sequence: sequence++,
          capturedAtMs: dependencies.now(),
          width: boundedSize(input.width, input.height).width,
          height: boundedSize(input.width, input.height).height,
          bitmap: frame,
        };
        let accepted = false;
        try {
          accepted = dependencies.submit(command);
        } catch {
          accepted = false;
        }
        if (!accepted) closeVisionBitmap(frame);
        return accepted;
      } catch {
        return false;
      } finally {
        inFlight = false;
      }
    },
    stop() {
      epoch += 1;
      sequence = 0;
    },
    dispose() {
      disposed = true;
      epoch += 1;
      sequence = 0;
    },
  };
}
