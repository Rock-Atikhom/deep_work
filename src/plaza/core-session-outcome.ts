import type { SessionState } from "../session/session-machine";
import type { PlazaSessionOutcome } from "./plaza-types";

export function plazaOutcomeFromCoreSession(session: SessionState): PlazaSessionOutcome | null {
  if (
    typeof session.sessionId !== "string" ||
    session.sessionId.length === 0 ||
    session.sessionStartedAtMs === null ||
    session.finishedAtMs === null ||
    session.finishReason === null
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
