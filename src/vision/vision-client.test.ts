import { describe, expect, it, vi } from "vitest";
import { createVisionClient, type VisionWorkerPort } from "./vision-client";

class FakeWorker implements VisionWorkerPort {
  readonly messages: Array<{ message: unknown; transfer: Transferable[] | undefined }> = [];
  readonly terminate = vi.fn();
  private readonly listeners = new Set<(event: MessageEvent<unknown>) => void>();
  postMessage(message: unknown, transfer?: Transferable[]) {
    this.messages.push({ message, transfer });
  }
  addEventListener(_type: "message", listener: (event: MessageEvent<unknown>) => void) {
    this.listeners.add(listener);
  }
  removeEventListener(_type: "message", listener: (event: MessageEvent<unknown>) => void) {
    this.listeners.delete(listener);
  }
  dispatch(data: unknown) {
    this.listeners.forEach((listener) => listener({ data } as MessageEvent<unknown>));
  }
}

function bitmap() {
  return { close: vi.fn() } as unknown as ImageBitmap & { close: ReturnType<typeof vi.fn> };
}

describe("VisionClient", () => {
  it("prepares only through the worker, starts calibration, and transfers bitmaps", async () => {
    const worker = new FakeWorker();
    const client = createVisionClient({ createWorker: () => worker });
    const preparing = client.prepare();
    expect(worker.messages[0]?.message).toMatchObject({ type: "PREPARE", generation: 1 });
    worker.dispatch({
      type: "READY",
      generation: 1,
      releaseId: "977cdb653fa4d787",
      wasmTier: "simd",
    });
    await preparing;
    expect(client.snapshot.phase).toBe("ready");

    client.startCalibration();
    expect(worker.messages.at(-1)?.message).toEqual({ type: "START_CALIBRATION", generation: 1 });
    const frame = bitmap();
    expect(
      client.submitFrame(frame, { cameraGeneration: 2, capturedAtMs: 12, width: 640, height: 360 }),
    ).toBe(true);
    expect(worker.messages.at(-1)?.transfer).toEqual([frame]);
    expect(worker.messages.at(-1)?.message).toMatchObject({ type: "FRAME", sequence: 0 });
  });

  it("ignores stale and out-of-order observations and disposes the worker", async () => {
    const worker = new FakeWorker();
    const client = createVisionClient({ createWorker: () => worker });
    const preparing = client.prepare();
    worker.dispatch({
      type: "READY",
      generation: 1,
      releaseId: "977cdb653fa4d787",
      wasmTier: "simd",
    });
    await preparing;
    client.startCalibration();
    const observation = {
      capturedAtMs: 1,
      evidenceQuality: "reliable",
      faceCount: 1,
      gazeDownScore: 0.1,
      headAwayScore: 0.1,
    } as const;
    worker.dispatch({ type: "OBSERVATION", generation: 1, sequence: 4, observation });
    worker.dispatch({
      type: "OBSERVATION",
      generation: 1,
      sequence: 3,
      observation: { ...observation, gazeDownScore: 0.9 },
    });
    worker.dispatch({ type: "OBSERVATION", generation: 0, sequence: 10, observation });
    expect(client.snapshot.lastObservation).toEqual(observation);
    client.dispose();
    expect(worker.messages.at(-1)?.message).toEqual({ type: "DISPOSE" });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("retries preparation once on a recoverable worker error", async () => {
    const first = new FakeWorker();
    const second = new FakeWorker();
    let workerCount = 0;
    const createWorker = vi.fn<() => FakeWorker>(() => {
      workerCount += 1;
      return workerCount === 1 ? first : second;
    });
    const client = createVisionClient({ createWorker });
    const preparing = client.prepare();
    first.dispatch({
      type: "ERROR",
      generation: 1,
      code: "runtime-download-failed",
      recoverable: true,
    });
    expect(second.messages.at(-1)?.message).toMatchObject({ type: "PREPARE", generation: 2 });
    second.dispatch({
      type: "READY",
      generation: 2,
      releaseId: "977cdb653fa4d787",
      wasmTier: "baseline",
    });
    await preparing;
    expect(client.snapshot).toMatchObject({ generation: 2, phase: "ready" });
    expect(first.terminate).toHaveBeenCalledOnce();
  });
});
