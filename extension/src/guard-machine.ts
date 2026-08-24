export type GuardPhase = "idle" | "watching" | "interruption" | "permission-lost";

export interface GuardSessionSummary {
  completionStatus: "completed" | "incomplete";
  courseOrigin: string;
  courseUrl: string;
  elapsedMs: number;
  finishedAtMs: number;
  id: string;
  returnCount: number;
  startedAtMs: number;
}

export type GuardEvent =
  | { type: "START"; atMs: number; courseUrl: string; tabId: number }
  | { type: "ACTIVE_TAB_CHANGED"; tabId: number; url: string }
  | { type: "PERMISSION_REVOKED"; atMs: number }
  | { type: "RETURN_TO_COURSE" }
  | { type: "STOP"; atMs: number };

export interface GuardState {
  courseOrigin: string | null;
  courseUrl: string | null;
  interruptionCount: number;
  latestInCourseTabId: number | null;
  latestInCourseUrl: string | null;
  lastSession: GuardSessionSummary | null;
  phase: GuardPhase;
  returnCount: number;
  sessionId: string | null;
  sessionStartedAtMs: number | null;
}

export function createGuardState(): GuardState {
  return {
    courseOrigin: null,
    courseUrl: null,
    interruptionCount: 0,
    latestInCourseTabId: null,
    latestInCourseUrl: null,
    lastSession: null,
    phase: "idle",
    returnCount: 0,
    sessionId: null,
    sessionStartedAtMs: null,
  };
}

function originOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.origin : null;
  } catch {
    return null;
  }
}

function sessionSummary(
  state: GuardState,
  atMs: number,
  completionStatus: GuardSessionSummary["completionStatus"],
): GuardSessionSummary | null {
  if (
    !state.courseOrigin ||
    !state.courseUrl ||
    !state.sessionId ||
    state.sessionStartedAtMs === null
  ) {
    return null;
  }
  return {
    completionStatus,
    courseOrigin: state.courseOrigin,
    courseUrl: state.courseUrl,
    elapsedMs: Math.max(0, atMs - state.sessionStartedAtMs),
    finishedAtMs: atMs,
    id: state.sessionId,
    returnCount: state.returnCount,
    startedAtMs: state.sessionStartedAtMs,
  };
}

function idleAfterSession(state: GuardState, summary: GuardSessionSummary | null): GuardState {
  return { ...createGuardState(), lastSession: summary };
}

export function reduceGuard(state: GuardState, event: GuardEvent): GuardState {
  switch (event.type) {
    case "START": {
      const courseOrigin = originOf(event.courseUrl);
      if (!courseOrigin) return state;
      return {
        ...createGuardState(),
        courseOrigin,
        courseUrl: event.courseUrl,
        latestInCourseTabId: event.tabId,
        latestInCourseUrl: event.courseUrl,
        phase: "watching",
        sessionId: `guard-${event.atMs}`,
        sessionStartedAtMs: event.atMs,
      };
    }

    case "ACTIVE_TAB_CHANGED": {
      if (state.phase === "idle" || state.phase === "permission-lost" || !state.courseOrigin) {
        return state;
      }
      const activeOrigin = originOf(event.url);
      if (activeOrigin === state.courseOrigin) {
        const returning = state.phase === "interruption";
        return {
          ...state,
          latestInCourseTabId: event.tabId,
          latestInCourseUrl: event.url,
          phase: "watching",
          returnCount: returning ? state.returnCount + 1 : state.returnCount,
        };
      }
      return {
        ...state,
        interruptionCount:
          state.phase === "watching" ? state.interruptionCount + 1 : state.interruptionCount,
        phase: "interruption",
      };
    }

    case "PERMISSION_REVOKED": {
      if (state.phase === "idle" || state.phase === "permission-lost") return state;
      return {
        ...state,
        lastSession: sessionSummary(state, event.atMs, "incomplete"),
        phase: "permission-lost",
      };
    }

    case "RETURN_TO_COURSE":
      if (state.phase === "idle" || state.phase === "permission-lost") return state;
      return {
        ...state,
        phase: "watching",
        returnCount: state.phase === "interruption" ? state.returnCount + 1 : state.returnCount,
      };

    case "STOP": {
      if (state.phase === "idle") return state;
      const completionStatus = state.phase === "permission-lost" ? "incomplete" : "completed";
      return idleAfterSession(
        state,
        state.lastSession ?? sessionSummary(state, event.atMs, completionStatus),
      );
    }
  }
}
