import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  createSessionState,
  reduceSession,
  remainingMs,
  type SessionConfig,
} from "../session/session-machine";
import { serializeQuestionDeck, type QuestionDeck } from "../decks/question-deck";
import { openDeepWorkRepository } from "./repository";

const config: SessionConfig = {
  durationMs: 25 * 60_000,
  goal: "Review joins",
  sound: "silent",
  subject: "SQL",
};

function databaseName() {
  return `deep-work-test-${crypto.randomUUID()}`;
}

describe("Deep Work local repository", () => {
  it("persists only the recoverable timer contract", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    let session = createSessionState(config);
    session = reduceSession(session, { type: "START", atMs: 1_000, sessionId: "session-1" });

    await repository.saveActiveSession(session);
    const snapshot = await repository.load();
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.active?.sessionId).toBe("session-1");
    expect(snapshot.garden.plants).toHaveLength(0);
    expect(snapshot.active?.sessionStartedAtMs).toBe(1_000);
    expect(remainingMs(snapshot.active!, 61_000)).toBe(24 * 60_000);
    expect(serialized).not.toMatch(/frame|image|landmark|blendshape|iris|gaze|headPose/i);

    repository.close();
  });

  it("writes one completed summary when completion is retried", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    let session = createSessionState(config);
    session = reduceSession(session, { type: "START", atMs: 1_000, sessionId: "session-2" });
    session = reduceSession(session, { type: "END", atMs: 121_000 });
    session = reduceSession(session, { type: "REFLECT", value: "yes", atMs: 122_000 });

    await repository.completeSession(session);
    await repository.completeSession(session);
    const snapshot = await repository.load();

    expect(snapshot.active).toBeNull();
    expect(snapshot.summaries).toHaveLength(1);
    expect(snapshot.summaries[0]).toMatchObject({
      awarenessCount: 0,
      elapsedMs: 120_000,
      reflection: "yes",
      sessionId: "session-2",
    });

    repository.close();
  });

  it("stores preferences separately from active session state", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });

    await repository.savePreferences({
      durationMs: 50 * 60_000,
      selectedDeckId: null,
      sound: "soft",
    });

    await expect(repository.load()).resolves.toMatchObject({
      preferences: { durationMs: 50 * 60_000, sound: "soft" },
    });
    repository.close();
  });

  it("exports and deletes every durable category", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    let session = createSessionState(config);
    session = reduceSession(session, { type: "START", atMs: 1_000, sessionId: "session-3" });
    session = reduceSession(session, { type: "END", atMs: 2_000 });
    session = reduceSession(session, { type: "REFLECT", value: "partly", atMs: 3_000 });
    await repository.completeSession(session);
    await repository.savePreferences({
      durationMs: 50 * 60_000,
      selectedDeckId: null,
      sound: "soft",
    });

    const exported = await repository.exportData();
    expect(exported).toContain("Review joins");
    expect(exported).toContain("Learning Garden");

    const afterDelete = await repository.deleteAllData();
    expect(afterDelete.active).toBeNull();
    expect(afterDelete.garden.plants).toHaveLength(0);
    expect(afterDelete.summaries).toHaveLength(0);
    expect(afterDelete.preferences).toEqual({
      durationMs: 25 * 60_000,
      selectedDeckId: null,
      sound: "silent",
    });
    repository.close();
  });

  it("seeds an editable deck and keeps invalid imports from changing local content", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    const initial = await repository.load();
    expect(initial.decks).toHaveLength(1);
    expect(initial.decks[0]).toMatchObject({ id: "sample-sql", subject: "SQL" });

    const editedDeck = {
      ...initial.decks[0]!,
      name: "SQL joins review",
      questions: [
        {
          ...initial.decks[0]!.questions[0]!,
          explanation: "Matching keys remain in an INNER JOIN.",
        },
      ],
    } satisfies QuestionDeck;
    await repository.saveDeck(editedDeck);
    await repository.savePreferences({
      durationMs: 25 * 60_000,
      selectedDeckId: editedDeck.id,
      sound: "silent",
    });

    const imported = await repository.importDeck(
      serializeQuestionDeck({
        id: "history-basics",
        name: "History basics",
        questions: [
          {
            explanation: "A primary source was created during the period studied.",
            id: "history-1",
            prompt: "What is a primary source?",
          },
        ],
        schemaVersion: 1,
        subject: "History",
      }),
    );
    expect(imported.decks.map((deck) => deck.id)).toEqual(["sample-sql", "history-basics"]);

    await expect(repository.importDeck("{bad")).rejects.toThrow(/valid JSON/i);
    await expect(repository.load()).resolves.toMatchObject({
      decks: imported.decks,
      preferences: { selectedDeckId: "sample-sql" },
    });

    const afterDelete = await repository.deleteDeck("history-basics");
    expect(afterDelete.decks.map((deck) => deck.id)).toEqual(["sample-sql"]);
    const cleared = await repository.deleteAllData();
    expect(cleared.decks).toHaveLength(0);
    expect(cleared.preferences.selectedDeckId).toBeNull();
    repository.close();
  });
});
