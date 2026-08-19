import { describe, expect, it, vi } from "vitest";
import { playAwarenessChime } from "./sound";

describe("awareness chime", () => {
  it("returns a disabled result without creating audio", async () => {
    const result = await playAwarenessChime({ enabled: false, volume: 0.5 });
    expect(result).toEqual({ played: false, reason: "disabled" });
  });

  it("returns a blocked result when browser audio cannot start", async () => {
    vi.stubGlobal(
      "AudioContext",
      class {
        createOscillator() {
          throw new Error("blocked");
        }
      },
    );
    const result = await playAwarenessChime({ enabled: true, volume: 2 });
    expect(result).toEqual({ played: false, reason: "blocked" });
    vi.unstubAllGlobals();
  });
});
