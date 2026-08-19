import { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { FaceLandmarkerOptions } from "@mediapipe/tasks-vision";
import { VisionAssetError, VisionAssetOperationalError, verifyVisionResponse } from "./integrity";
import {
  getAssetByRole,
  parseVisionManifest,
  visionManifestsEqual,
  type VisionAsset,
  type VisionAssetRole,
  type VisionReleaseManifest,
} from "./manifest";
import type { VisionReason } from "./protocol";
import { VISION_MANIFEST } from "./release";

type WasmFileset = Parameters<typeof FaceLandmarker.createFromOptions>[0];
type PreparedLandmarker = {
  close(): void;
  detectForVideo(frame: ImageBitmap, timestampMs: number): unknown;
};
type RuntimeFailureCode = Extract<
  VisionReason,
  | "runtime-download-failed"
  | "runtime-integrity-failed"
  | "runtime-initialization-failed"
  | "runtime-cancelled"
  | "offline-cache-failed"
>;
export type WasmTier = "simd" | "baseline";

export interface VisionRuntimeDependencies {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  manifest: VisionReleaseManifest;
  supportsSimd(): boolean;
  createLandmarker(
    fileset: WasmFileset,
    options: FaceLandmarkerOptions,
  ): Promise<PreparedLandmarker>;
}
export interface PrepareVisionRuntimeInput {
  manifestUrl: string;
  releaseId: string;
  signal: AbortSignal;
  onPhase(phase: "verifying" | "initializing"): void;
}
export interface PreparedVisionRuntime {
  wasmTier: WasmTier;
  detectForVideo(frame: ImageBitmap, timestampMs: number): unknown;
  close(): void;
}
export class VisionRuntimeError extends Error {
  readonly code: RuntimeFailureCode;
  constructor(code: RuntimeFailureCode) {
    super("Vision runtime failed");
    this.name = "VisionRuntimeError";
    this.code = code;
  }
}
const SIMD_PROBE = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 9, 1, 7, 0, 65, 0, 253, 15, 26,
  11,
]);
function resolveVisionPath(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  if (base === "/" || path.startsWith(base)) return path;
  return `${base.replace(/\/$/, "")}${path}`;
}
function throwIfCancelled(signal: AbortSignal): void {
  if (signal.aborted) throw new VisionRuntimeError("runtime-cancelled");
}
function closeLandmarker(landmarker: PreparedLandmarker): void {
  try {
    landmarker.close();
  } catch {
    /* worker owns cleanup */
  }
}
function unsupportedSimd(error: unknown): boolean {
  return (
    error instanceof WebAssembly.CompileError ||
    error instanceof WebAssembly.LinkError ||
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "NotSupportedError")
  );
}
async function fetchResponse(
  url: string,
  signal: AbortSignal,
  dependencies: VisionRuntimeDependencies,
): Promise<Response> {
  try {
    return await dependencies.fetch(url, { signal });
  } catch {
    throwIfCancelled(signal);
    throw new VisionRuntimeError("runtime-download-failed");
  }
}
async function loadManifest(
  input: PrepareVisionRuntimeInput,
  dependencies: VisionRuntimeDependencies,
): Promise<VisionReleaseManifest> {
  if (input.releaseId !== dependencies.manifest.releaseId)
    throw new VisionRuntimeError("runtime-integrity-failed");
  const response = await fetchResponse(input.manifestUrl, input.signal, dependencies);
  throwIfCancelled(input.signal);
  if (!response.ok) throw new VisionRuntimeError("runtime-download-failed");
  let value: unknown;
  try {
    value = await response.json();
  } catch (error) {
    throwIfCancelled(input.signal);
    throw new VisionRuntimeError(
      error instanceof SyntaxError ? "runtime-integrity-failed" : "offline-cache-failed",
    );
  }
  try {
    const manifest = parseVisionManifest(value);
    if (
      manifest.releaseId !== input.releaseId ||
      !visionManifestsEqual(manifest, dependencies.manifest)
    )
      throw new VisionRuntimeError("runtime-integrity-failed");
    return manifest;
  } catch (error) {
    if (error instanceof VisionRuntimeError) throw error;
    throwIfCancelled(input.signal);
    throw new VisionRuntimeError("runtime-integrity-failed");
  }
}
function requireAsset(manifest: VisionReleaseManifest, role: VisionAssetRole): VisionAsset {
  const asset = getAssetByRole(manifest, role);
  if (!asset) throw new VisionRuntimeError("runtime-integrity-failed");
  return asset;
}
async function loadAsset(
  asset: VisionAsset,
  signal: AbortSignal,
  dependencies: VisionRuntimeDependencies,
): Promise<Uint8Array> {
  const response = await fetchResponse(resolveVisionPath(asset.path), signal, dependencies);
  throwIfCancelled(signal);
  try {
    const bytes = await verifyVisionResponse(response, asset, {
      source: "verified-service-worker-immutable-route",
    });
    throwIfCancelled(signal);
    return bytes;
  } catch (error) {
    if (error instanceof VisionAssetOperationalError)
      throw new VisionRuntimeError("offline-cache-failed");
    if (error instanceof VisionAssetError)
      throw new VisionRuntimeError(
        error.code === "runtime-download-failed"
          ? "runtime-download-failed"
          : "runtime-integrity-failed",
      );
    if (error instanceof VisionRuntimeError) throw error;
    throwIfCancelled(signal);
    throw new VisionRuntimeError("runtime-integrity-failed");
  }
}
function tierRoles(tier: WasmTier): { loader: VisionAssetRole; binary: VisionAssetRole } {
  return tier === "simd"
    ? { loader: "wasm-loader-simd", binary: "wasm-binary-simd" }
    : { loader: "wasm-loader-baseline", binary: "wasm-binary-baseline" };
}
async function constructTier(
  tier: WasmTier,
  manifest: VisionReleaseManifest,
  model: Uint8Array,
  input: PrepareVisionRuntimeInput,
  dependencies: VisionRuntimeDependencies,
): Promise<PreparedVisionRuntime> {
  const roles = tierRoles(tier);
  const loader = requireAsset(manifest, roles.loader);
  const binary = requireAsset(manifest, roles.binary);
  await Promise.all([
    loadAsset(loader, input.signal, dependencies),
    loadAsset(binary, input.signal, dependencies),
  ]);
  throwIfCancelled(input.signal);
  const fileset: WasmFileset = {
    wasmBinaryPath: resolveVisionPath(binary.path),
    wasmLoaderPath: resolveVisionPath(loader.path),
  };
  const options: FaceLandmarkerOptions = {
    baseOptions: { delegate: "CPU", modelAssetBuffer: model },
    numFaces: 2,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
    runningMode: "VIDEO",
  };
  input.onPhase("initializing");
  const landmarker = await dependencies.createLandmarker(fileset, options);
  if (input.signal.aborted) {
    closeLandmarker(landmarker);
    throw new VisionRuntimeError("runtime-cancelled");
  }
  let closed = false;
  return {
    wasmTier: tier,
    detectForVideo: (frame, timestampMs) => landmarker.detectForVideo(frame, timestampMs),
    close() {
      if (!closed) {
        closed = true;
        closeLandmarker(landmarker);
      }
    },
  };
}
export async function prepareVisionRuntime(
  input: PrepareVisionRuntimeInput,
  dependencies: VisionRuntimeDependencies,
): Promise<PreparedVisionRuntime> {
  throwIfCancelled(input.signal);
  input.onPhase("verifying");
  const manifest = await loadManifest(input, dependencies);
  const model = await loadAsset(
    requireAsset(manifest, "face-landmarker-model"),
    input.signal,
    dependencies,
  );
  throwIfCancelled(input.signal);
  let simd = false;
  try {
    simd = dependencies.supportsSimd();
  } catch {
    simd = false;
  }
  if (simd) {
    try {
      return await constructTier("simd", manifest, model, input, dependencies);
    } catch (error) {
      if (!unsupportedSimd(error)) throw error;
    }
  }
  return constructTier("baseline", manifest, model, input, dependencies);
}
export function createBrowserVisionDependencies(): VisionRuntimeDependencies {
  return {
    fetch: (input, init) => globalThis.fetch(input, init),
    manifest: VISION_MANIFEST,
    supportsSimd: () => typeof WebAssembly !== "undefined" && WebAssembly.validate(SIMD_PROBE),
    createLandmarker: (fileset, options) => FaceLandmarker.createFromOptions(fileset, options),
  };
}
