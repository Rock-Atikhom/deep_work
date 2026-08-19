import { describe, expect, it, vi } from "vitest";
import {
  prepareVisionRuntime,
  VisionRuntimeError,
  type VisionRuntimeDependencies,
} from "./runtime-loader";
import type { VisionAsset, VisionReleaseManifest } from "./manifest";

const releaseId = "0123456789abcdef";
const bytesByRole = {
  "face-landmarker-model": new Uint8Array([1, 2, 3]),
  "wasm-loader-simd": new Uint8Array([4, 5, 6]),
  "wasm-binary-simd": new Uint8Array([7, 8, 9]),
  "wasm-loader-baseline": new Uint8Array([10, 11, 12]),
  "wasm-binary-baseline": new Uint8Array([13, 14, 15]),
} as const;

async function hash(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function manifest(): Promise<VisionReleaseManifest> {
  const assets = await Promise.all(
    Object.entries(bytesByRole).map(async ([role, bytes]): Promise<VisionAsset> => ({
      bytes: bytes.byteLength,
      id: role,
      licenseRef: "/vision/mediapipe-0.10.35-face-landmarker-float16-v1/LICENSE-MediaPipe.txt",
      path: `/vision/mediapipe-0.10.35-face-landmarker-float16-v1/${role}.bin`,
      requiredForOffline: true,
      role: role as VisionAsset["role"],
      sha256: await hash(bytes),
      source: `https://example.test/${role}`,
      version: role === "face-landmarker-model" ? "float16/1" : "0.10.35",
    })),
  );
  return {
    assets: assets.sort((left, right) => left.path.localeCompare(right.path)),
    modelVersion: "float16/1",
    releaseId,
    runtimeVersion: "0.10.35",
    schemaVersion: 1,
  };
}

describe("prepareVisionRuntime", () => {
  it("verifies the local manifest and selected WASM/model bytes before construction", async () => {
    const configured = await manifest();
    const responseByPath = new Map(
      configured.assets.map((asset) => [
        asset.path,
        new Response(bytesByRole[asset.role as keyof typeof bytesByRole]),
      ]),
    );
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/vision/manifest.json") return Response.json(configured);
      return responseByPath.get(url) ?? new Response(null, { status: 404 });
    });
    const createLandmarker = vi.fn(async () => ({
      close: vi.fn(),
      detectForVideo: vi.fn(),
    }));
    const dependencies: VisionRuntimeDependencies = {
      createLandmarker,
      fetch,
      manifest: configured,
      supportsSimd: () => true,
    };

    const runtime = await prepareVisionRuntime(
      {
        manifestUrl: "/vision/manifest.json",
        releaseId,
        signal: new AbortController().signal,
        onPhase: vi.fn(),
      },
      dependencies,
    );
    expect(runtime.wasmTier).toBe("simd");
    expect(createLandmarker).toHaveBeenCalledOnce();
    runtime.close();
  });

  it("falls back to baseline only for an unsupported SIMD construction", async () => {
    const configured = await manifest();
    const responseByPath = new Map(
      configured.assets.map((asset) => [
        asset.path,
        new Response(bytesByRole[asset.role as keyof typeof bytesByRole]),
      ]),
    );
    const createLandmarker = vi
      .fn()
      .mockRejectedValueOnce(new WebAssembly.CompileError("unsupported"))
      .mockResolvedValueOnce({ close: vi.fn(), detectForVideo: vi.fn() });
    const runtime = await prepareVisionRuntime(
      {
        manifestUrl: "/vision/manifest.json",
        releaseId,
        signal: new AbortController().signal,
        onPhase: vi.fn(),
      },
      {
        createLandmarker,
        fetch: vi.fn(async (input: RequestInfo | URL) =>
          String(input) === "/vision/manifest.json"
            ? Response.json(configured)
            : (responseByPath.get(String(input)) ?? new Response(null, { status: 404 })),
        ),
        manifest: configured,
        supportsSimd: () => true,
      },
    );
    expect(runtime.wasmTier).toBe("baseline");
    expect(createLandmarker).toHaveBeenCalledTimes(2);
  });

  it("does not construct a landmarker after an integrity failure", async () => {
    const configured = await manifest();
    const pending = prepareVisionRuntime(
      {
        manifestUrl: "/vision/manifest.json",
        releaseId,
        signal: new AbortController().signal,
        onPhase: vi.fn(),
      },
      {
        createLandmarker: vi.fn(),
        fetch: vi.fn(async (input: RequestInfo | URL) =>
          String(input) === "/vision/manifest.json"
            ? Response.json({ ...configured, releaseId: "fedcba9876543210" })
            : new Response(null, { status: 404 }),
        ),
        manifest: configured,
        supportsSimd: () => true,
      },
    );
    await expect(pending).rejects.toBeInstanceOf(VisionRuntimeError);
    await expect(pending).rejects.toMatchObject({ code: "runtime-integrity-failed" });
  });
});
