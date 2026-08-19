import type { PresetName } from "../session/session-types";
import { AWARENESS_ENTRY_SCORE, AWARENESS_RECOVERY_SCORE, PRESETS } from "./presets";
import type { VisionObservation } from "./types";

export type AwarenessSignal = "gaze-down" | "head-away" | "face-absent";
export type AwarenessEvent = { atMs: number; signal: AwarenessSignal };
export type AwarenessPolicyState = {
  preset: PresetName;
  lastTimestampMs: number | null;
  lastReliableFaceAtMs: number | null;
  gazeDwellStartedAtMs: number | null;
  headDwellStartedAtMs: number | null;
  absentDwellStartedAtMs: number | null;
  lastEventAtMs: number | null;
  recoveryStartedAtMs: number | null;
  awaitingRecovery: boolean;
};
export type AwarenessAdvance = { state: AwarenessPolicyState; event: AwarenessEvent | null };

export function createAwarenessPolicy(preset: PresetName): AwarenessPolicyState {
  return {
    preset,
    lastTimestampMs: null,
    lastReliableFaceAtMs: null,
    gazeDwellStartedAtMs: null,
    headDwellStartedAtMs: null,
    absentDwellStartedAtMs: null,
    lastEventAtMs: null,
    recoveryStartedAtMs: null,
    awaitingRecovery: false,
  };
}

function monotonicTimestamp(state: AwarenessPolicyState, timestampMs: number): number {
  return Math.max(
    state.lastTimestampMs ?? timestampMs,
    Number.isFinite(timestampMs) ? timestampMs : 0,
  );
}

function resetDwell(state: AwarenessPolicyState): AwarenessPolicyState {
  return {
    ...state,
    gazeDwellStartedAtMs: null,
    headDwellStartedAtMs: null,
    absentDwellStartedAtMs: null,
  };
}

function cooldownElapsed(state: AwarenessPolicyState, timestampMs: number): boolean {
  return (
    state.lastEventAtMs === null ||
    timestampMs - state.lastEventAtMs >= PRESETS[state.preset].cooldownMs
  );
}

function recoverySatisfied(state: AwarenessPolicyState, timestampMs: number): boolean {
  return (
    !state.awaitingRecovery ||
    (state.recoveryStartedAtMs !== null &&
      timestampMs - state.recoveryStartedAtMs >= PRESETS[state.preset].recoveryMs)
  );
}

export function advanceAwareness(
  state: AwarenessPolicyState,
  observation: VisionObservation,
): AwarenessAdvance {
  const timestampMs = monotonicTimestamp(state, observation.capturedAtMs);
  let next: AwarenessPolicyState = { ...state, lastTimestampMs: timestampMs };

  const reliable = observation.evidenceQuality === "reliable";
  const singleFace = observation.faceCount === 1;
  const recovered =
    reliable &&
    singleFace &&
    observation.gazeDownScore < AWARENESS_RECOVERY_SCORE &&
    observation.headAwayScore < AWARENESS_RECOVERY_SCORE;

  if (recovered) {
    next = {
      ...resetDwell(next),
      recoveryStartedAtMs: next.recoveryStartedAtMs ?? timestampMs,
    };
    if (
      next.awaitingRecovery &&
      next.recoveryStartedAtMs !== null &&
      timestampMs - next.recoveryStartedAtMs >= PRESETS[next.preset].recoveryMs
    ) {
      next = { ...next, awaitingRecovery: false };
    }
  } else if (reliable && singleFace) {
    next = { ...next, recoveryStartedAtMs: null };
  }

  if (!reliable || observation.faceCount > 1) return { state: next, event: null };

  if (singleFace) {
    next = { ...next, lastReliableFaceAtMs: timestampMs };
    if (observation.gazeDownScore >= AWARENESS_ENTRY_SCORE) {
      next.gazeDwellStartedAtMs ??= timestampMs;
    } else if (observation.gazeDownScore < AWARENESS_RECOVERY_SCORE) {
      next.gazeDwellStartedAtMs = null;
    }
    if (observation.headAwayScore >= AWARENESS_ENTRY_SCORE) {
      next.headDwellStartedAtMs ??= timestampMs;
    } else if (observation.headAwayScore < AWARENESS_RECOVERY_SCORE) {
      next.headDwellStartedAtMs = null;
    }
  } else if (next.lastReliableFaceAtMs !== null) {
    next.absentDwellStartedAtMs ??= next.lastReliableFaceAtMs;
  }

  if (
    next.awaitingRecovery ||
    !cooldownElapsed(next, timestampMs) ||
    !recoverySatisfied(next, timestampMs)
  ) {
    return { state: next, event: null };
  }

  const preset = PRESETS[next.preset];
  const candidates: Array<{
    signal: AwarenessSignal;
    startedAtMs: number;
    dwellMs: number;
    order: number;
  }> = [];
  if (next.gazeDwellStartedAtMs !== null)
    candidates.push({
      signal: "gaze-down",
      startedAtMs: next.gazeDwellStartedAtMs,
      dwellMs: timestampMs - next.gazeDwellStartedAtMs,
      order: 0,
    });
  if (next.headDwellStartedAtMs !== null)
    candidates.push({
      signal: "head-away",
      startedAtMs: next.headDwellStartedAtMs,
      dwellMs: timestampMs - next.headDwellStartedAtMs,
      order: 1,
    });
  if (next.absentDwellStartedAtMs !== null)
    candidates.push({
      signal: "face-absent",
      startedAtMs: next.absentDwellStartedAtMs,
      dwellMs: timestampMs - next.absentDwellStartedAtMs,
      order: 2,
    });
  const thresholds: Record<AwarenessSignal, number> = {
    "gaze-down": preset.awayMs,
    "head-away": preset.awayMs,
    "face-absent": preset.absentMs,
  };
  const eligible = candidates.filter(
    (candidate) => candidate.dwellMs >= thresholds[candidate.signal],
  );
  if (eligible.length === 0) return { state: next, event: null };
  eligible.sort((left, right) => right.dwellMs - left.dwellMs || left.order - right.order);
  const winner = eligible[0]!;
  const event: AwarenessEvent = { atMs: timestampMs, signal: winner.signal };
  next = { ...next, lastEventAtMs: timestampMs, awaitingRecovery: true, recoveryStartedAtMs: null };
  return { state: next, event };
}
