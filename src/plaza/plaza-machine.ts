import {
  PLAZA_SCHEMA_VERSION,
  type CompanionMood,
  type PlazaSessionOutcome,
  type PlazaState,
} from "./plaza-types";
import { rewardForSession, unlockedCosmeticIdsForGrowth } from "./plaza-rewards";

export type PlazaEvent =
  | { type: "SESSION_STARTED" }
  | { type: "DISTRACTION_DETECTED" }
  | { type: "RETURNED_TO_COURSE" }
  | { type: "BREAK_TAKEN" }
  | { type: "SESSION_COMPLETED"; outcome: PlazaSessionOutcome }
  | { type: "SESSION_ENDED"; outcome: PlazaSessionOutcome }
  | { type: "EQUIP_COSMETIC"; cosmeticId: string }
  | { type: "SET_MOOD"; mood: CompanionMood }
  | { type: "RENAME_COMPANION"; name: string };

export interface GuardMoodInput {
  connection: "connected" | "disconnected";
  phase: "idle" | "watching" | "interruption" | "permission-lost";
}

const MAX_ENERGY = 100;

function clampEnergy(value: number): number {
  return Math.max(0, Math.min(MAX_ENERGY, value));
}

function levelForGrowth(growthPoints: number): number {
  return Math.max(1, Math.floor(growthPoints / 50) + 1);
}

export function createInitialPlazaState(): PlazaState {
  return {
    schemaVersion: PLAZA_SCHEMA_VERSION,
    companion: {
      name: "Momo",
      mood: "ready",
      energy: MAX_ENERGY,
      growthPoints: 0,
      level: 1,
      equippedCosmeticIds: [],
      unlockedCosmeticIds: [],
      unlockedPlazaItemIds: [],
    },
    courseGuardSessions: [],
  };
}

export function companionMoodForGuardState(input: GuardMoodInput): CompanionMood {
  if (input.connection === "disconnected") return "resting";
  if (input.phase === "watching") return "focusing";
  if (input.phase === "interruption" || input.phase === "permission-lost") {
    return "encouraging";
  }
  return "ready";
}

function terminalState(state: PlazaState, outcome: PlazaSessionOutcome): PlazaState {
  const reward = rewardForSession(outcome);
  const growthPoints = state.companion.growthPoints + reward.growthPoints;
  const record = { ...outcome, ...reward };
  const existingIndex = state.courseGuardSessions.findIndex((session) => session.id === outcome.id);
  const sessions = [...state.courseGuardSessions];
  if (existingIndex === -1) sessions.push(record);
  else sessions[existingIndex] = record;

  return {
    ...state,
    companion: {
      ...state.companion,
      mood: "proud",
      energy: clampEnergy(state.companion.energy + 8),
      growthPoints,
      level: levelForGrowth(growthPoints),
      unlockedCosmeticIds: unlockedCosmeticIdsForGrowth(
        growthPoints,
        state.companion.unlockedCosmeticIds,
      ),
    },
    courseGuardSessions: sessions,
  };
}

export function reducePlazaState(state: PlazaState, event: PlazaEvent): PlazaState {
  switch (event.type) {
    case "SESSION_STARTED":
      return {
        ...state,
        companion: {
          ...state.companion,
          mood: "focusing",
          energy: clampEnergy(state.companion.energy - 2),
        },
      };
    case "DISTRACTION_DETECTED":
      return { ...state, companion: { ...state.companion, mood: "encouraging" } };
    case "RETURNED_TO_COURSE":
      return { ...state, companion: { ...state.companion, mood: "focusing" } };
    case "BREAK_TAKEN":
      return {
        ...state,
        companion: {
          ...state.companion,
          mood: "ready",
          energy: clampEnergy(state.companion.energy + 10),
        },
      };
    case "SESSION_COMPLETED":
    case "SESSION_ENDED":
      return terminalState(state, event.outcome);
    case "EQUIP_COSMETIC":
      if (!state.companion.unlockedCosmeticIds.includes(event.cosmeticId)) return state;
      return {
        ...state,
        companion: {
          ...state.companion,
          equippedCosmeticIds: state.companion.equippedCosmeticIds.includes(event.cosmeticId)
            ? state.companion.equippedCosmeticIds.filter((id) => id !== event.cosmeticId)
            : [...state.companion.equippedCosmeticIds, event.cosmeticId],
        },
      };
    case "SET_MOOD":
      return { ...state, companion: { ...state.companion, mood: event.mood } };
    case "RENAME_COMPANION": {
      const name = event.name.trim();
      return name.length === 0 ? state : { ...state, companion: { ...state.companion, name } };
    }
  }
}
