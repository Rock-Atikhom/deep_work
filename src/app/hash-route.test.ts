import { describe, expect, it } from "vitest";
import { formatHashRoute, parseHashRoute } from "./hash-route";

describe("hash routes", () => {
  it("recognizes the Learning Plaza destinations", () => {
    expect(parseHashRoute("#/plaza")).toBe("plaza");
    expect(parseHashRoute("#/course-guard")).toBe("course-guard");
    expect(parseHashRoute("#/archive")).toBe("archive");
    expect(parseHashRoute("#/wardrobe")).toBe("wardrobe");
    expect(parseHashRoute("#/town-hall")).toBe("town-hall");
  });

  it("keeps the study journey on known hash routes", () => {
    expect(parseHashRoute("#/focus")).toBe("focus");
    expect(parseHashRoute("#calibration")).toBe("calibration");
    expect(parseHashRoute("#/unknown")).toBe("welcome");
    expect(formatHashRoute("quick-review")).toBe("#/quick-review");
    expect(parseHashRoute("#/settings")).toBe("settings");
    expect(formatHashRoute("history")).toBe("#/history");
  });
});
