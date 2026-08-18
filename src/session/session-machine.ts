export type SessionPhase = "setup" | "focus" | "paused" | "reflection" | "complete";
export type Reflection = "yes" | "partly" | "not-yet";
export type SoundPreference = "silent" | "soft" | "standard";
export type FinishReason = "completed" | "ended" | null;

export interface SessionConfig {
  durationMs: number;
  goal: string;
  sound: SoundPreference;
  subject: string;
}

export interface SessionState {
  config: SessionConfig;
  elapsedMs: number;
  finishReason: FinishReason;
  pausedAtMs: number | null;
  phase: SessionPhase;
  reflection: Reflection | null;
  startedAtMs: number | null;
}

export type SessionEvent =
  | { type: "START"; atMs: number }
  | { type: "PAUSE"; atMs: number }
  | { type: "RESUME"; atMs: number }
  | { type: "TICK"; atMs: number }
  | { type: "END"; atMs: number }
  | { type: "REFLECT"; value: Reflection }
  | { type: "RESET" };

export function createSessionState(config: SessionConfig): SessionState {
  return {
    config,
    elapsedMs: 0,
    finishReason: null,
    pausedAtMs: null,
    phase: "setup",
    reflection: null,
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
    pausedAtMs: null,
    phase: "reflection",
    startedAtMs: null,
  };
}

export function reduceSession(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case "START":
      if (state.phase !== "setup") return state;
      return { ...state, phase: "focus", startedAtMs: event.atMs };

    case "PAUSE":
      if (state.phase !== "focus") return state;
      return {
        ...state,
        elapsedMs: elapsedAt(state, event.atMs),
        pausedAtMs: event.atMs,
        phase: "paused",
        startedAtMs: null,
      };

    case "RESUME":
      if (state.phase !== "paused") return state;
      return { ...state, pausedAtMs: null, phase: "focus", startedAtMs: event.atMs };

    case "TICK": {
      if (state.phase !== "focus") return state;
      const elapsedMs = elapsedAt(state, event.atMs);
      if (elapsedMs >= state.config.durationMs) {
        return {
          ...state,
          elapsedMs: state.config.durationMs,
          finishReason: "completed",
          phase: "reflection",
          startedAtMs: null,
        };
      }
      return { ...state, elapsedMs };
    }

    case "END":
      if (state.phase !== "focus" && state.phase !== "paused") return state;
      return finish(state, event.atMs, "ended");

    case "REFLECT":
      if (state.phase !== "reflection") return state;
      return { ...state, phase: "complete", reflection: event.value };

    case "RESET":
      if (state.phase !== "complete") return state;
      return createSessionState(state.config);
  }
}
