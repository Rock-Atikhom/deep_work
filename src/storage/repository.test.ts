import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  createSessionState,
  reduceSession,
  remainingMs,
  type SessionConfig,
} from "../session/session-machine";
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

    await repository.savePreferences({ durationMs: 50 * 60_000, sound: "soft" });

    await expect(repository.load()).resolves.toMatchObject({
      preferences: { durationMs: 50 * 60_000, sound: "soft" },
    });
    repository.close();
  });
});
