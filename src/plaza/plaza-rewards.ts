import type { PlazaSessionOutcome } from "./plaza-types";

export type CosmeticKind = "companion" | "plaza";

export interface CosmeticDefinition {
  id: string;
  kind: CosmeticKind;
  label: string;
  requiredGrowthPoints: number;
}

export interface RewardInput {
  completionStatus: PlazaSessionOutcome["completionStatus"];
  elapsedMs: number;
  returnCount: number;
}

export interface SessionReward {
  growthPoints: number;
  rewardId: string | null;
}

export const PLAZA_COSMETICS: readonly CosmeticDefinition[] = [
  { id: "sticker-sun", kind: "companion", label: "Sun sticker", requiredGrowthPoints: 25 },
  { id: "hat-leaf", kind: "companion", label: "Leaf cap", requiredGrowthPoints: 50 },
  { id: "plaza-lantern", kind: "plaza", label: "Plaza lantern", requiredGrowthPoints: 75 },
  { id: "cloud-arch", kind: "plaza", label: "Cloud arch", requiredGrowthPoints: 100 },
];

function positiveFocusedMinutes(elapsedMs: number): number {
  return elapsedMs > 0 ? Math.max(1, Math.floor(elapsedMs / 60_000)) : 0;
}

export function rewardForSession(input: RewardInput): SessionReward {
  const growthPoints = Math.min(50, positiveFocusedMinutes(input.elapsedMs));
  const rewardId =
    input.completionStatus === "completed" && growthPoints >= 25 ? "sticker-sun" : null;
  return { growthPoints, rewardId };
}

export function nextUnlock(input: {
  growthPoints: number;
  unlockedCosmeticIds: string[];
}): CosmeticDefinition | null {
  return (
    PLAZA_COSMETICS.find(
      (cosmetic) =>
        !input.unlockedCosmeticIds.includes(cosmetic.id) &&
        cosmetic.requiredGrowthPoints > input.growthPoints,
    ) ?? null
  );
}

export function unlockedCosmeticIdsForGrowth(growthPoints: number, currentIds: string[]): string[] {
  const unlocked = new Set(currentIds);
  for (const cosmetic of PLAZA_COSMETICS) {
    if (cosmetic.requiredGrowthPoints <= growthPoints) unlocked.add(cosmetic.id);
  }
  return [...unlocked];
}
