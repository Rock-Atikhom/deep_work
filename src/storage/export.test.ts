import { describe, expect, it } from "vitest";
import { formatLocalExport } from "./export";
import type { RepositorySnapshot } from "./repository";

const snapshot: RepositorySnapshot = {
  active: null,
  decks: [
    {
      id: "sample-sql",
      name: "SQL study prompts",
      questions: [
        {
          explanation: "A primary key identifies a row uniquely.",
          id: "sample-sql-1",
          prompt: "What does a primary key identify?",
        },
      ],
      schemaVersion: 1,
      subject: "SQL",
    },
  ],
  garden: {
    plants: [],
    schemaVersion: 1,
  },
  preferences: { durationMs: 25 * 60_000, selectedDeckId: "sample-sql", sound: "silent" },
  schemaVersion: 1,
  summaries: [
    {
      awarenessCount: 0,
      durationMs: 25 * 60_000,
      elapsedMs: 25 * 60_000,
      finishedAtMs: 26_000,
      finishReason: "completed",
      goal: "Review joins",
      reflection: "yes",
      schemaVersion: 1,
      sessionId: "session-1",
      startedAtMs: 1_000,
      subject: "SQL",
    },
  ],
};

describe("local data export", () => {
  it("is human-readable and contains only durable learning records", () => {
    const exported = formatLocalExport(snapshot);
    const parsed = JSON.parse(exported) as RepositorySnapshot;

    expect(parsed.summaries[0]?.reflection).toBe("yes");
    expect(parsed.garden).toEqual(snapshot.garden);
    expect(parsed.decks).toEqual(snapshot.decks);
    expect(exported).not.toMatch(/frame|image|landmark|blendshape|iris|gaze|headPose/i);
    expect(exported).toContain("Deep Work Companion local data");
  });
});
