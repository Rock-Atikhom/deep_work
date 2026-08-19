export type SessionPhase =
  | "welcome"
  | "consent"
  | "setup"
  | "calibration"
  | "focus"
  | "gentle-reset"
  | "quick-review"
  | "paused"
  | "notes-pause"
  | "break"
  | "reflection"
  | "complete";
export type Reflection = "yes" | "partly" | "not-yet";
export type SoundPreference = "silent" | "soft" | "standard";
export type FinishReason = "completed" | "ended" | null;
export type AwarenessMode = "active" | "paused-hidden" | "paused-manual";
export type AwarenessSignal = "gaze-down" | "head-away" | "face-absent";

export interface SessionConfig {
  cameraMode?: "enabled" | "disabled";
  deckId?: string | null;
  durationMs: number;
  goal: string;
  preset?: "gentle" | "balanced" | "strict";
  sound: SoundPreference;
  subject: string;
}

export interface SessionState {
  config: SessionConfig;
  elapsedMs: number;
  awarenessCount: number;
  awarenessMode: AwarenessMode;
  quickReviewCompleted: boolean;
  finishReason: FinishReason;
  finishedAtMs: number | null;
  pausedAtMs: number | null;
  phase: SessionPhase;
  reflection: Reflection | null;
  sessionId: string | null;
  sessionStartedAtMs: number | null;
  startedAtMs: number | null;
}

export type SessionEvent =
  | { type: "START"; atMs: number; sessionId?: string }
  | { type: "PAUSE"; atMs: number }
  | { type: "RESUME"; atMs: number }
  | { type: "TICK"; atMs: number }
  | { type: "END"; atMs: number }
  | { type: "AWARENESS_EVENT"; atMs: number; signal: AwarenessSignal }
  | { type: "CONTINUE_STUDYING"; atMs: number }
  | { type: "OPEN_QUICK_REVIEW"; atMs: number }
  | { type: "COMPLETE_REVIEW"; atMs: number }
  | { type: "TAKING_NOTES"; atMs: number }
  | { type: "PAGE_HIDDEN"; atMs: number }
  | { type: "PAGE_VISIBLE"; atMs: number }
  | { type: "END_SESSION"; atMs: number }
  | { type: "REFLECT"; atMs?: number; value: Reflection }
  | { type: "RESET" };

export function createSessionState(config: SessionConfig): SessionState {
  return {
    config,
    elapsedMs: 0,
    awarenessCount: 0,
    awarenessMode: "active",
    quickReviewCompleted: false,
    finishReason: null,
    finishedAtMs: null,
    pausedAtMs: null,
    phase: "setup",
    reflection: null,
    sessionId: null,
    sessionStartedAtMs: null,
    startedAtMs: null,
  };
}

function elapsedAt(state: SessionState, atMs: number): number {
  if (state.phase !== "focus" || state.startedAtMs === null) {
    return state.elapsedMs;
  }

  return Math.min(state.config.durationMs, state.elapsedMs + Math.max(0, atMs - state.startedAtMs));
}

export function remainingMs(state: SessionState, atMs: number): number {
  if (state.phase === "reflection" || state.phase === "complete") {
    return 0;
  }

  return Math.max(0, state.config.durationMs - elapsedAt(state, atMs));
}

function finish(
  state: SessionState,
  atMs: number,
  reason: Exclude<FinishReason, null>,
): SessionState {
  const elapsedMs = elapsedAt(state, atMs);
  return {
    ...state,
    elapsedMs,
    finishReason: reason,
    finishedAtMs: atMs,
    pausedAtMs: null,
    phase: "reflection",
    startedAtMs: null,
  };
}

export function reduceSession(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case "START":
      if (state.phase !== "setup") return state;
      return {
        ...state,
        phase: "focus",
        awarenessMode: "active",
        sessionId: event.sessionId ?? `session-${event.atMs}`,
        sessionStartedAtMs: event.atMs,
        startedAtMs: event.atMs,
      };

    case "PAUSE":
      if (state.phase !== "focus") return state;
      return {
        ...state,
        elapsedMs: elapsedAt(state, event.atMs),
        pausedAtMs: event.atMs,
        phase: "paused",
        awarenessMode: "paused-manual",
        startedAtMs: null,
      };

    case "RESUME":
      if (state.phase !== "paused" && state.phase !== "notes-pause") return state;
      return {
        ...state,
        awarenessMode: "active",
        pausedAtMs: null,
        phase: "focus",
        startedAtMs: event.atMs,
      };

    case "TICK": {
      if (state.phase !== "focus") return state;
      const elapsedMs = elapsedAt(state, event.atMs);
      if (elapsedMs >= state.config.durationMs) {
        return {
          ...state,
          elapsedMs: state.config.durationMs,
          finishReason: "completed",
          finishedAtMs: event.atMs,
          phase: "reflection",
          startedAtMs: null,
        };
      }
      return { ...state, elapsedMs };
    }

    case "END":
      if (state.phase !== "focus" && state.phase !== "paused") return state;
      return finish(state, event.atMs, "ended");

    case "END_SESSION":
      if (state.phase !== "focus" && state.phase !== "paused") return state;
      return finish(state, event.atMs, "ended");

    case "AWARENESS_EVENT":
      if (state.phase !== "focus" || state.awarenessMode !== "active") return state;
      return {
        ...state,
        awarenessCount: state.awarenessCount + 1,
        awarenessMode: "paused-manual",
        elapsedMs: elapsedAt(state, event.atMs),
        pausedAtMs: event.atMs,
        phase: "gentle-reset",
        startedAtMs: null,
      };

    case "CONTINUE_STUDYING":
      if (state.phase !== "gentle-reset") return state;
      return {
        ...state,
        awarenessMode: "active",
        pausedAtMs: null,
        phase: "focus",
        startedAtMs: event.atMs,
      };

    case "OPEN_QUICK_REVIEW":
      if (state.phase !== "gentle-reset") return state;
      return { ...state, phase: "quick-review" };

    case "COMPLETE_REVIEW":
      if (state.phase !== "quick-review") return state;
      return {
        ...state,
        awarenessMode: "active",
        phase: "focus",
        quickReviewCompleted: true,
        startedAtMs: event.atMs,
      };

    case "TAKING_NOTES":
      if (state.phase !== "gentle-reset") return state;
      return {
        ...state,
        awarenessMode: "paused-manual",
        pausedAtMs: event.atMs,
        phase: "notes-pause",
        startedAtMs: null,
      };

    case "PAGE_HIDDEN":
      if (state.phase !== "focus" && state.phase !== "paused") return state;
      return { ...state, awarenessMode: "paused-hidden" };

    case "PAGE_VISIBLE":
      if (state.awarenessMode !== "paused-hidden") return state;
      return { ...state, awarenessMode: "active" };

    case "REFLECT":
      if (state.phase !== "reflection") return state;
      return {
        ...state,
        finishedAtMs: state.finishedAtMs ?? event.atMs ?? null,
        phase: "complete",
        reflection: event.value,
      };

    case "RESET":
      if (state.phase !== "complete") return state;
      return createSessionState(state.config);
  }
}
