import { describe, expect, it } from "vitest";
import { resolveAppPath } from "./app-path";

describe("resolveAppPath", () => {
  it("keeps vision assets inside the GitHub Pages project path", () => {
    expect(resolveAppPath("vision/manifest.json", "/deep_work/")).toBe(
      "/deep_work/vision/manifest.json",
    );
  });

  it("keeps hash routes inside the GitHub Pages project path", () => {
    expect(resolveAppPath("#/privacy", "/deep_work/")).toBe("/deep_work/#/privacy");
  });
});
