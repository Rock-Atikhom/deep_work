import { describe, expect, it } from "vitest";
import { createSessionState, reduceSession, type SessionState } from "../session/session-machine";
import { plazaOutcomeFromCoreSession } from "./core-session-outcome";

function completedCoreSession(): SessionState {
  const started = reduceSession(
    createSessionState({
      durationMs: 25 * 60_000,
      goal: "Review joins",
      sound: "silent",
      subject: "SQL",
    }),
    { atMs: 1_000, sessionId: "core-1", type: "START" },
  );
  return reduceSession(started, { atMs: 1_501_000, type: "TICK" });
}

describe("plazaOutcomeFromCoreSession", () => {
  it("maps a completed core timer to a stable Plaza outcome", () => {
    expect(plazaOutcomeFromCoreSession(completedCoreSession())).toEqual({
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

  it.each([
    ["a missing session identifier", { sessionId: undefined }],
    ["an empty session identifier", { sessionId: "" }],
    ["a whitespace-only session identifier", { sessionId: " \t\n " }],
    ["a missing start timestamp", { sessionStartedAtMs: undefined }],
    ["a non-finite start timestamp", { sessionStartedAtMs: Number.NaN }],
    ["a missing finish timestamp", { finishedAtMs: undefined }],
    ["a non-finite finish timestamp", { finishedAtMs: Number.POSITIVE_INFINITY }],
    ["a missing elapsed duration", { elapsedMs: undefined }],
    ["a negative elapsed duration", { elapsedMs: -1 }],
    ["a non-finite elapsed duration", { elapsedMs: Number.NaN }],
    ["an invalid terminal phase", { phase: "focus" }],
    ["a missing terminal phase", { phase: undefined }],
    ["an invalid finish reason", { finishReason: "legacy-complete" }],
    ["a missing finish reason", { finishReason: undefined }],
    ["finish time before start time", { finishedAtMs: 999 }],
  ])("rejects legacy terminal data with %s", (_label, overrides) => {
    const state = { ...completedCoreSession(), ...overrides } as unknown as SessionState;

    expect(plazaOutcomeFromCoreSession(state)).toBeNull();
  });

  it("maps a legitimately reflected core session", () => {
    const reflected = reduceSession(completedCoreSession(), { type: "REFLECT", value: "yes" });

    expect(plazaOutcomeFromCoreSession(reflected)).toMatchObject({
      completionStatus: "completed",
      elapsedMs: 25 * 60_000,
      finishedAtMs: 1_501_000,
      id: "core-1",
      startedAtMs: 1_000,
    });
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
