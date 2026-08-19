import { describe, expect, it } from "vitest";
import {
  createSessionState,
  reduceSession,
  remainingMs,
  type SessionConfig,
} from "./session-machine";

const config: SessionConfig = {
  durationMs: 25 * 60_000,
  goal: "Review joins",
  sound: "silent",
  subject: "SQL",
};

describe("Timer-Only Focus Session state", () => {
  it("starts, tracks elapsed time, pauses, resumes, and ends in reflection", () => {
    let state = createSessionState(config);

    expect(state.phase).toBe("setup");
    state = reduceSession(state, { type: "START", atMs: 1_000 });
    expect(state.phase).toBe("focus");
    expect(remainingMs(state, 61_000)).toBe(24 * 60_000);

    state = reduceSession(state, { type: "PAUSE", atMs: 121_000 });
    expect(state.phase).toBe("paused");
    expect(remainingMs(state, 500_000)).toBe(23 * 60_000);

    state = reduceSession(state, { type: "RESUME", atMs: 500_000 });
    expect(state.phase).toBe("focus");
    state = reduceSession(state, { type: "END", atMs: 560_000 });
    expect(state.phase).toBe("reflection");
    expect(state.elapsedMs).toBe(3 * 60_000);
  });

  it("moves to reflection when the selected duration completes", () => {
    let state = createSessionState({ ...config, durationMs: 5_000 });
    state = reduceSession(state, { type: "START", atMs: 10_000 });
    state = reduceSession(state, { type: "TICK", atMs: 15_000 });

    expect(state.phase).toBe("reflection");
    expect(state.elapsedMs).toBe(5_000);
    expect(remainingMs(state, 20_000)).toBe(0);
  });

  it("stores the goal reflection and can reset for another session", () => {
    let state = createSessionState(config);
    state = reduceSession(state, { type: "START", atMs: 1_000 });
    state = reduceSession(state, { type: "END", atMs: 2_000 });
    state = reduceSession(state, { type: "REFLECT", value: "partly" });

    expect(state.phase).toBe("complete");
    expect(state.reflection).toBe("partly");
    expect(reduceSession(state, { type: "RESET" }).phase).toBe("setup");
  });

  it("counts awareness events without changing timer progress and pauses awareness when hidden", () => {
    let state = createSessionState(config);
    state = reduceSession(state, { type: "START", atMs: 1_000 });
    state = reduceSession(state, { type: "AWARENESS_EVENT", atMs: 5_000, signal: "gaze-down" });
    expect(state.awarenessCount).toBe(1);
    expect(state.phase).toBe("gentle-reset");
    state = reduceSession(state, { type: "CONTINUE_STUDYING", atMs: 5_500 });
    state = reduceSession(state, { type: "PAGE_HIDDEN", atMs: 6_000 });
    expect(state.awarenessMode).toBe("paused-hidden");
    expect(state.phase).toBe("focus");
  });

  it("records a completed optional Quick Review for reflection and garden growth", () => {
    let state = createSessionState(config);
    state = reduceSession(state, { type: "START", atMs: 1_000 });
    state = reduceSession(state, { type: "AWARENESS_EVENT", atMs: 5_000, signal: "gaze-down" });
    state = reduceSession(state, { type: "OPEN_QUICK_REVIEW", atMs: 5_100 });
    state = reduceSession(state, { type: "COMPLETE_REVIEW", atMs: 6_000 });

    expect(state.phase).toBe("focus");
    expect(state.quickReviewCompleted).toBe(true);
  });
});
