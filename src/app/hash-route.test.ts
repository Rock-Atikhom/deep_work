import { describe, expect, it } from "vitest";
import { formatHashRoute, parseHashRoute } from "./hash-route";

describe("hash routes", () => {
  it("keeps the study journey on known hash routes", () => {
    expect(parseHashRoute("#/focus")).toBe("focus");
    expect(parseHashRoute("#calibration")).toBe("calibration");
    expect(parseHashRoute("#/unknown")).toBe("welcome");
    expect(formatHashRoute("quick-review")).toBe("#/quick-review");
  });
});
