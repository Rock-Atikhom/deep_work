import { describe, expect, it } from "vitest";
import { VISION_MANIFEST, VISION_MANIFEST_URL } from "./release";

describe("pinned vision release", () => {
  it("exports the verified local Face Landmarker manifest", () => {
    expect(VISION_MANIFEST.runtimeVersion).toBe("0.10.35");
    expect(VISION_MANIFEST.modelVersion).toBe("float16/1");
    expect(VISION_MANIFEST.assets).toHaveLength(12);
    expect(VISION_MANIFEST_URL).toContain("release-manifest");
  });
});
