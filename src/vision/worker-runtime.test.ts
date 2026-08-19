import { describe, expect, it, vi } from "vitest";
import { type VisionWorkerEvent } from "./protocol";
import { createVisionWorkerRuntime } from "./worker-runtime";

describe("VisionWorkerRuntime", () => {
  it("closes stale, malformed, and inferred bitmaps without posting raw landmarks", async () => {
    const events: VisionWorkerEvent[] = [];
    const stale = { close: vi.fn() } as unknown as ImageBitmap & {
      close: ReturnType<typeof vi.fn>;
    };
    const malformed = { close: vi.fn() };
    const prepared = {
      close: vi.fn(),
      detectForVideo: vi.fn(() => ({
        faceLandmarks: [],
        facialTransformationMatrixes: [],
      })),
      wasmTier: "simd" as const,
    };
    const runtime = createVisionWorkerRuntime(
      {
        createLandmarker: vi.fn(async () => prepared),
        fetch: vi.fn(async () => Response.json({})),
        manifest: {} as never,
        supportsSimd: () => true,
      },
      (event) => events.push(event),
      {
        prepareRuntime: vi.fn(async () => prepared),
      },
    );

    runtime.receive({
      type: "FRAME",
      generation: 1,
      cameraGeneration: 1,
      sequence: 1,
      capturedAtMs: 10,
      width: 640,
      height: 360,
      bitmap: stale,
    });
    expect(stale.close).toHaveBeenCalledOnce();
    runtime.receive({
      type: "FRAME",
      generation: 1,
      cameraGeneration: 1,
      sequence: 1,
      capturedAtMs: 10,
      width: 640,
      height: 360,
      bitmap: malformed,
    });
    expect(malformed.close).toHaveBeenCalledOnce();
    expect(events.some((event) => JSON.stringify(event).includes("faceLandmarks"))).toBe(false);
    runtime.dispose();
  });
});
