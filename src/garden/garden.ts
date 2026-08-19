import type { SessionSummary } from "../storage/repository";

export const GARDEN_SCHEMA_VERSION = 1 as const;

export type PlantStage = "sprout" | "leaf" | "bloom";

export interface GardenPlant {
  createdAtMs: number;
  growth: number;
  sessionId: string;
  stage: PlantStage;
  subject: string;
}

export interface GardenState {
  plants: GardenPlant[];
  schemaVersion: typeof GARDEN_SCHEMA_VERSION;
}

function stageForGrowth(growth: number): PlantStage {
  if (growth >= 3) return "bloom";
  if (growth >= 2) return "leaf";
  return "sprout";
}

export function deriveGardenPlant(summary: SessionSummary): GardenPlant {
  const growth =
    (summary.finishReason === "completed" ? 2 : 1) + (summary.reflection === "yes" ? 1 : 0);

  return {
    createdAtMs: summary.finishedAtMs,
    growth,
    sessionId: summary.sessionId,
    stage: stageForGrowth(growth),
    subject: summary.subject,
  };
}

export function deriveGarden(summaries: SessionSummary[]): GardenState {
  return {
    plants: [...summaries]
      .sort((left, right) => left.startedAtMs - right.startedAtMs)
      .map(deriveGardenPlant),
    schemaVersion: GARDEN_SCHEMA_VERSION,
  };
}
