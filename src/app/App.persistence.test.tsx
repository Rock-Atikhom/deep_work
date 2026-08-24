import "fake-indexeddb/auto";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createSessionState, reduceSession, type SessionConfig } from "../session/session-machine";
import {
  openDeepWorkRepository,
  type DeepWorkRepository,
  type SessionPreferences,
} from "../storage/repository";
import { createInitialPlazaState } from "../plaza/plaza-machine";
import { App } from "./App";

const config: SessionConfig = {
  durationMs: 25 * 60_000,
  goal: "Review joins",
  sound: "silent",
  subject: "SQL",
};

function databaseName() {
  return `deep-work-app-test-${crypto.randomUUID()}`;
}

afterEach(() => {
  window.location.hash = "";
});

function failingRepository(): DeepWorkRepository {
  const unavailable = () => Promise.reject(new Error("Storage blocked"));
  return {
    close() {},
    completeSession: unavailable,
    deleteAllData: unavailable,
    deleteDeck: unavailable,
    exportData: unavailable,
    importDeck: unavailable,
    load: unavailable,
    savePlaza: unavailable,
    saveDeck: unavailable,
    saveActiveSession: unavailable,
    savePreferences: unavailable,
  };
}

describe("Timer-Only persistence", () => {
  it("persists a Momo care action from the Plaza dashboard", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    const initialPlaza = createInitialPlazaState();
    await repository.savePlaza({
      ...initialPlaza,
      companion: { ...initialPlaza.companion, energy: 94 },
    });
    window.location.hash = "#/plaza";
    render(<App repository={repository} />);

    await screen.findByRole("heading", { name: "Momo's Plaza" });
    await waitFor(() => expect(screen.getByLabelText("Energy")).toHaveValue(94));
    fireEvent.click(screen.getByRole("button", { name: "Let Momo rest" }));

    await waitFor(async () => {
      const snapshot = await repository.load();
      expect(snapshot.plaza.companion).toMatchObject({ energy: 100, mood: "resting" });
    });
    repository.close();
  });

  it("recovers an active session after the app mounts again", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    const startedAtMs = Date.now() - 60_000;
    let session = createSessionState(config);
    session = reduceSession(session, {
      atMs: startedAtMs,
      sessionId: "recovered-session",
      type: "START",
    });
    await repository.saveActiveSession(session);

    render(<App repository={repository} />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Focus Stage" })).toBeInTheDocument(),
    );
    expect(screen.getByText("Review joins")).toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    repository.close();
  });

  it("keeps one summary when the student completes a session", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    const rendered = render(<App repository={repository} />);

    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "SQL" } });
    fireEvent.change(screen.getByLabelText("Session goal"), { target: { value: "Review joins" } });
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));
    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    await waitFor(async () => {
      const snapshot = await repository.load();
      expect(snapshot.active).toBeNull();
      expect(snapshot.summaries).toHaveLength(1);
      expect(snapshot.summaries[0]?.reflection).toBe("yes");
    });
    rendered.unmount();
    render(<App repository={repository} />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Session complete" })).toBeInTheDocument(),
    );
    expect(screen.getAllByText("Reflection: Yes").length).toBeGreaterThan(0);
    repository.close();
  });

  it("hydrates saved preferences and falls back to memory when storage fails", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    const preferences: SessionPreferences = {
      durationMs: 50 * 60_000,
      selectedDeckId: null,
      sound: "soft",
    };
    await repository.savePreferences(preferences);
    render(<App repository={repository} />);

    await waitFor(() => {
      expect(screen.getByRole("radio", { name: "50 minutes" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "Soft" })).toBeChecked();
    });
    repository.close();

    render(<App repository={failingRepository()} />);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/local saving is unavailable/i),
    );
    fireEvent.change(screen.getAllByLabelText("Subject")[1]!, { target: { value: "Math" } });
    fireEvent.change(screen.getAllByLabelText("Session goal")[1]!, {
      target: { value: "Practice limits" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Start session" })[1]!);
    expect(screen.getByRole("heading", { name: "Focus Stage" })).toBeInTheDocument();
  });
});
