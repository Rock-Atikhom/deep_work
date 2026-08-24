import { describe, expect, it } from "vitest";
import { createSessionState, reduceSession } from "../session/session-machine";
import { plazaOutcomeFromCoreSession } from "./core-session-outcome";

describe("plazaOutcomeFromCoreSession", () => {
  it("maps a completed core timer to a stable Plaza outcome", () => {
    const started = reduceSession(
      createSessionState({
        durationMs: 25 * 60_000,
        goal: "Review joins",
        sound: "silent",
        subject: "SQL",
      }),
      { atMs: 1_000, sessionId: "core-1", type: "START" },
    );
    const completed = reduceSession(started, { atMs: 1_501_000, type: "TICK" });

    expect(plazaOutcomeFromCoreSession(completed)).toEqual({
      completionStatus: "completed",
      courseLabel: "SQL",
      courseOrigin: "deep-work://local",
      elapsedMs: 25 * 60_000,
      finishedAtMs: 1_501_000,
      id: "core-1",
      returnCount: 0,
      startedAtMs: 1_000,
    });
  });

  it("rejects a terminal state without a stable session identifier", () => {
    const state = {
      ...createSessionState({
        durationMs: 1,
        goal: "Read",
        sound: "silent",
        subject: "Math",
      }),
      phase: "complete" as const,
    };

    expect(plazaOutcomeFromCoreSession(state)).toBeNull();
  });

  it("maps an ended core timer to an incomplete Plaza outcome", () => {
    const started = reduceSession(
      createSessionState({
        durationMs: 25 * 60_000,
        goal: "Review joins",
        sound: "silent",
        subject: "SQL",
      }),
      { atMs: 1_000, sessionId: "core-2", type: "START" },
    );
    const ended = reduceSession(started, { atMs: 301_000, type: "END" });

    expect(plazaOutcomeFromCoreSession(ended)).toMatchObject({
      completionStatus: "incomplete",
      elapsedMs: 300_000,
      finishedAtMs: 301_000,
      id: "core-2",
      startedAtMs: 1_000,
    });
  });
});
