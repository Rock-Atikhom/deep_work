import { describe, expect, it } from "vitest";
import {
  companionMoodForGuardState,
  createInitialPlazaState,
  reducePlazaState,
} from "./plaza-machine";

describe("plaza companion state", () => {
  it("moves through ready, focusing, encouraging, and proud states", () => {
    let state = createInitialPlazaState();
    expect(state.companion.mood).toBe("ready");
    state = reducePlazaState(state, { type: "SESSION_STARTED" });
    expect(state.companion.mood).toBe("focusing");
    state = reducePlazaState(state, { type: "DISTRACTION_DETECTED" });
    expect(state.companion.mood).toBe("encouraging");
    state = reducePlazaState(state, {
      type: "SESSION_COMPLETED",
      outcome: {
        completionStatus: "completed",
        courseLabel: "learn.example.com",
        courseOrigin: "https://learn.example.com",
        elapsedMs: 25 * 60_000,
        finishedAtMs: 2_500,
        id: "guard-1",
        returnCount: 1,
        startedAtMs: 1_000,
      },
    });
    expect(state.companion.mood).toBe("proud");
    expect(state.courseGuardSessions).toHaveLength(1);
    expect(state.companion.growthPoints).toBeGreaterThan(0);
  });

  it("maps disconnected and permission-lost states without claiming focus", () => {
    expect(companionMoodForGuardState({ connection: "disconnected", phase: "idle" })).toBe(
      "resting",
    );
    expect(companionMoodForGuardState({ connection: "connected", phase: "permission-lost" })).toBe(
      "encouraging",
    );
  });

  it("does not make a companion state negative when a break is taken", () => {
    const state = reducePlazaState(createInitialPlazaState(), { type: "BREAK_TAKEN" });
    expect(state.companion.energy).toBeGreaterThanOrEqual(0);
    expect(state.companion.growthPoints).toBe(0);
  });
});
