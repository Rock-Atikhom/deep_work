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

  it("does not apply growth twice for a repeated terminal session outcome", () => {
    const event = {
      outcome: {
        completionStatus: "completed" as const,
        courseLabel: "SQL",
        courseOrigin: "deep-work://local",
        elapsedMs: 25 * 60_000,
        finishedAtMs: 1_501_000,
        id: "core-session-reward",
        returnCount: 0,
        startedAtMs: 1_000,
      },
      type: "SESSION_COMPLETED" as const,
    };

    const awarded = reducePlazaState(createInitialPlazaState(), event);
    const replayed = reducePlazaState(awarded, event);

    expect(replayed.courseGuardSessions).toHaveLength(1);
    expect(replayed.companion.growthPoints).toBe(25);
    expect(replayed).toEqual(awarded);
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

  it("applies each care action without granting study growth", () => {
    const initial = {
      ...createInitialPlazaState(),
      companion: { ...createInitialPlazaState().companion, energy: 50 },
    };

    expect(
      reducePlazaState(initial, { action: "feed", type: "CARE_ACTION" }).companion,
    ).toMatchObject({
      energy: 60,
      growthPoints: 0,
      mood: "ready",
    });
    expect(
      reducePlazaState(initial, { action: "play", type: "CARE_ACTION" }).companion,
    ).toMatchObject({
      energy: 54,
      growthPoints: 0,
      mood: "proud",
    });
    expect(
      reducePlazaState(initial, { action: "rest", type: "CARE_ACTION" }).companion,
    ).toMatchObject({
      energy: 56,
      growthPoints: 0,
      mood: "resting",
    });
  });

  it("caps care energy at one hundred", () => {
    const state = {
      ...createInitialPlazaState(),
      companion: { ...createInitialPlazaState().companion, energy: 94 },
    };

    expect(reducePlazaState(state, { action: "feed", type: "CARE_ACTION" }).companion.energy).toBe(
      100,
    );
  });

  it("renames the companion and keeps the previous name for blank input", () => {
    const state = reducePlazaState(createInitialPlazaState(), {
      type: "RENAME_COMPANION",
      name: "  Pip  ",
    });
    expect(state.companion.name).toBe("Pip");

    const unchanged = reducePlazaState(state, { type: "RENAME_COMPANION", name: "   " });
    expect(unchanged.companion.name).toBe("Pip");
    expect(unchanged).toBe(state);
  });

  it("applies one of three preset color styles with sky as the default", () => {
    let state = createInitialPlazaState();
    expect(state.companion.colorStyle).toBe("sky");
    state = reducePlazaState(state, { type: "SET_COLOR_STYLE", colorStyle: "blossom" });
    expect(state.companion.colorStyle).toBe("blossom");

    state = reducePlazaState(state, { type: "SET_COLOR_STYLE", colorStyle: "meadow" });
    expect(state.companion.colorStyle).toBe("meadow");

    state = reducePlazaState(state, { type: "SET_COLOR_STYLE", colorStyle: "sky" });
    expect(state.companion.colorStyle).toBe("sky");
  });

  it("clears session history without touching companion settings", () => {
    const completed = reducePlazaState(createInitialPlazaState(), {
      type: "SESSION_COMPLETED",
      outcome: {
        completionStatus: "completed" as const,
        courseLabel: "SQL",
        courseOrigin: "https://learn.example.com",
        elapsedMs: 25 * 60_000,
        finishedAtMs: 1_501_000,
        id: "guard-1",
        returnCount: 1,
        startedAtMs: 1_000,
      },
    });

    const cleared = reducePlazaState(completed, { type: "CLEAR_SESSION_HISTORY" });

    expect(cleared.courseGuardSessions).toEqual([]);
    expect(cleared.companion).toEqual(completed.companion);
  });
});
