import { describe, expect, it, vi } from "vitest";
import {
  VISION_ASSET_ERROR_HEADER,
  verifyVisionResponse,
  VisionAssetError,
  type VisionAsset,
} from "./integrity";

const bytes = new TextEncoder().encode("verified vision asset");
const asset: VisionAsset = {
  bytes: bytes.byteLength,
  id: "wasm-loader-simd",
  licenseRef: "/vision/mediapipe-0.10.35-face-landmarker-float16-v1/LICENSE-MediaPipe.txt",
  path: "/vision/mediapipe-0.10.35-face-landmarker-float16-v1/vision_wasm_internal.js",
  requiredForOffline: true,
  role: "wasm-loader-simd",
  sha256: "",
  source: "https://example.test/vision_wasm_internal.js",
  version: "0.10.35",
};

async function sha256(bytesToHash: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytesToHash));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

describe("verifyVisionResponse", () => {
  it("returns fresh verified bytes", async () => {
    const expectedAsset = { ...asset, sha256: await sha256(bytes) };
    const verified = await verifyVisionResponse(new Response(bytes), expectedAsset);

    expect(Array.from(verified)).toEqual(Array.from(bytes));
    expect(verified).not.toBe(bytes);
  });

  it("reports a safe integrity error for changed byte length or hash", async () => {
    await expect(
      verifyVisionResponse(new Response(bytes), { ...asset, bytes: bytes.byteLength + 1 }),
    ).rejects.toMatchObject({ assetId: asset.id, code: "runtime-integrity-failed" });

    await expect(
      verifyVisionResponse(new Response(bytes), { ...asset, sha256: "0".repeat(64) }),
    ).rejects.toMatchObject({ assetId: asset.id, code: "runtime-integrity-failed" });
  });

  it("does not surface request details for failed responses", async () => {
    const response = new Response(null, { status: 404, statusText: "private upstream detail" });

    await expect(verifyVisionResponse(response, asset)).rejects.toBeInstanceOf(VisionAssetError);
    await expect(
      verifyVisionResponse(new Response(null, { status: 404 }), asset),
    ).rejects.toMatchObject({
      assetId: asset.id,
      code: "runtime-download-failed",
    });
  });

  it("does not trust a service-worker marker without trusted context", async () => {
    const response = new Response(null, {
      headers: { [VISION_ASSET_ERROR_HEADER]: "offline-cache-failed" },
      status: 503,
    });

    await expect(verifyVisionResponse(response, asset)).rejects.toMatchObject({
      assetId: asset.id,
      code: "runtime-download-failed",
    });
  });

  it("reports body and digest failures as safe operational errors", async () => {
    const bodyFailure = new Response(bytes);
    vi.spyOn(bodyFailure, "arrayBuffer").mockRejectedValue(new Error("private cache detail"));
    await expect(verifyVisionResponse(bodyFailure, asset)).rejects.toMatchObject({
      assetId: asset.id,
      code: "offline-cache-failed",
    });

    const validHash = await sha256(bytes);
    vi.spyOn(crypto.subtle, "digest").mockRejectedValueOnce(new Error("private digest detail"));
    await expect(
      verifyVisionResponse(new Response(bytes), { ...asset, sha256: validHash }),
    ).rejects.toMatchObject({
      assetId: asset.id,
      code: "offline-cache-failed",
    });
  });
});
