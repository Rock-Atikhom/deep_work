import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { configuredAssets, releaseDirectoryName } from "../../scripts/vision-release.config.mjs";

const visionDirectory = dirname(fileURLToPath(import.meta.url));
const releaseDirectory = join(visionDirectory, "../../public/vision", releaseDirectoryName);
const manifestPath = join(visionDirectory, "generated/release-manifest.json");

describe("offline vision release inventory", () => {
  it("contains only the pinned face-landmarker release assets", async () => {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      assets: Array<{ path: string; bytes: number; sha256: string }>;
      modelVersion: string;
      releaseId: string;
      runtimeVersion: string;
      schemaVersion: number;
    };
    const filenames = (await readdir(releaseDirectory)).sort();

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.runtimeVersion).toBe("0.10.35");
    expect(manifest.modelVersion).toBe("float16/1");
    expect(manifest.releaseId).toMatch(/^[a-f0-9]{16}$/);
    expect(manifest.assets.map(({ path }) => path)).toEqual(
      [...manifest.assets.map(({ path }) => path)].sort(),
    );
    expect(manifest.assets.map(({ path }) => path)).toEqual(
      configuredAssets
        .map(({ destination }) => `/vision/${releaseDirectoryName}/${destination}`)
        .sort(),
    );
    expect(filenames).toEqual(configuredAssets.map(({ destination }) => destination).sort());
    expect(filenames).not.toContain("selfie_segmenter.tflite");
    expect(
      manifest.assets.every(({ bytes, sha256 }) => bytes > 0 && /^[a-f0-9]{64}$/.test(sha256)),
    ).toBe(true);
  });
});
