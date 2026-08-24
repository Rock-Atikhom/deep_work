import type { SessionState } from "../session/session-machine";
import type { PlazaSessionOutcome } from "./plaza-types";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function plazaOutcomeFromCoreSession(session: SessionState): PlazaSessionOutcome | null {
  if (
    typeof session.sessionId !== "string" ||
    session.sessionId.trim().length === 0 ||
    (session.phase !== "reflection" && session.phase !== "complete") ||
    (session.finishReason !== "completed" && session.finishReason !== "ended") ||
    !isFiniteNumber(session.sessionStartedAtMs) ||
    !isFiniteNumber(session.finishedAtMs) ||
    !isFiniteNumber(session.elapsedMs) ||
    session.elapsedMs < 0 ||
    session.finishedAtMs < session.sessionStartedAtMs
  ) {
    return null;
  }

  return {
    id: session.sessionId,
    courseOrigin: "deep-work://local",
    courseLabel: session.config.subject,
    startedAtMs: session.sessionStartedAtMs,
    finishedAtMs: session.finishedAtMs,
    elapsedMs: session.elapsedMs,
    returnCount: 0,
    completionStatus: session.finishReason === "completed" ? "completed" : "incomplete",
  };
}
