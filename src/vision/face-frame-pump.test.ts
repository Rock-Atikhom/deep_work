import { describe, expect, it, vi } from "vitest";
import { createFaceFramePump } from "./face-frame-pump";

function bitmap() {
  return { close: vi.fn() } as unknown as ImageBitmap & { close: ReturnType<typeof vi.fn> };
}

describe("FaceFramePump", () => {
  it("captures at most one bounded 640px frame at a time", async () => {
    let release!: (value: ImageBitmap) => void;
    const capture = vi.fn(() => new Promise<ImageBitmap>((resolve) => (release = resolve)));
    const submit = vi.fn(() => true);
    const pump = createFaceFramePump({ capture, now: () => 42, submit });

    const first = pump.tick({ generation: 1, cameraGeneration: 3, width: 1920, height: 1080 });
    await expect(
      pump.tick({ generation: 1, cameraGeneration: 3, width: 1920, height: 1080 }),
    ).resolves.toBe(false);
    expect(capture).toHaveBeenCalledWith({ width: 640, height: 360 });

    const frame = bitmap();
    release(frame);
    await expect(first).resolves.toBe(true);
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ capturedAtMs: 42, generation: 1, sequence: 0 }),
    );
    expect(frame.close).not.toHaveBeenCalled();
  });

  it("closes a captured bitmap when the generation becomes stale", async () => {
    let release!: (value: ImageBitmap) => void;
    const capture = vi.fn(() => new Promise<ImageBitmap>((resolve) => (release = resolve)));
    const submit = vi.fn(() => true);
    const pump = createFaceFramePump({ capture, now: () => 100, submit });
    const pending = pump.tick({ generation: 1, cameraGeneration: 1, width: 640, height: 360 });
    pump.stop();
    const frame = bitmap();
    release(frame);

    await expect(pending).resolves.toBe(false);
    expect(frame.close).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
  });

  it("closes ownership when submission is rejected or the pump is disposed", async () => {
    const rejected = bitmap();
    const submit = vi.fn(() => false);
    const pump = createFaceFramePump({
      capture: vi.fn(async () => rejected),
      now: () => 1,
      submit,
    });
    await expect(
      pump.tick({ generation: 1, cameraGeneration: 1, width: 320, height: 240 }),
    ).resolves.toBe(false);
    expect(rejected.close).toHaveBeenCalledOnce();

    const disposed = bitmap();
    const disposedPump = createFaceFramePump({
      capture: vi.fn(async () => disposed),
      now: () => 1,
      submit: vi.fn(() => true),
    });
    disposedPump.dispose();
    await expect(
      disposedPump.tick({ generation: 1, cameraGeneration: 1, width: 320, height: 240 }),
    ).resolves.toBe(false);
    expect(disposed.close).not.toHaveBeenCalled();
  });
});
