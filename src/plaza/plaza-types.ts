export const PLAZA_SCHEMA_VERSION = 1 as const;

export type CompanionMood = "resting" | "ready" | "focusing" | "proud" | "encouraging";

export const COMPANION_COLOR_STYLES = ["sky", "blossom", "meadow"] as const;

export type CompanionColorStyle = (typeof COMPANION_COLOR_STYLES)[number];

export interface CompanionState {
  name: string;
  colorStyle: CompanionColorStyle;
  mood: CompanionMood;
  energy: number;
  growthPoints: number;
  level: number;
  equippedCosmeticIds: string[];
  unlockedCosmeticIds: string[];
  unlockedPlazaItemIds: string[];
}

export interface PlazaSessionOutcome {
  id: string;
  courseOrigin: string;
  courseLabel: string;
  startedAtMs: number;
  finishedAtMs: number;
  elapsedMs: number;
  returnCount: number;
  completionStatus: "completed" | "incomplete";
}

export interface CourseGuardSessionRecord extends PlazaSessionOutcome {
  growthPoints: number;
  rewardId: string | null;
}

export interface PlazaState {
  schemaVersion: typeof PLAZA_SCHEMA_VERSION;
  companion: CompanionState;
  courseGuardSessions: CourseGuardSessionRecord[];
}
