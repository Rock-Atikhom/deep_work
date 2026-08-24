import "fake-indexeddb/auto";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { deriveGarden, deriveGardenPlant } from "../garden/garden";
import type { SessionSummary } from "../storage/repository";
import { openDeepWorkRepository } from "../storage/repository";
import { App } from "../app/App";

function databaseName() {
  return `deep-work-progress-test-${crypto.randomUUID()}`;
}

function summary(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    awarenessCount: 0,
    durationMs: 25 * 60_000,
    elapsedMs: 60_000,
    finishedAtMs: 61_000,
    finishReason: "ended",
    goal: "Review joins",
    schemaVersion: 1,
    sessionId: "session-seeds",
    startedAtMs: 1_000,
    subject: "SQL",
    ...overrides,
  };
}

describe("reflection, garden, and data controls", () => {
  it("stores a Partly reflection with focus facts and permanent seed growth", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    render(<App repository={repository} />);

    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "SQL" } });
    fireEvent.change(screen.getByLabelText("Session goal"), { target: { value: "Review joins" } });
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));
    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    fireEvent.click(screen.getByRole("button", { name: "Partly" }));

    await waitFor(async () => {
      const snapshot = await repository.load();
      expect(snapshot.summaries).toHaveLength(1);
      expect(snapshot.summaries[0]?.reflection).toBe("partly");
      expect(snapshot.summaries[0]?.elapsedMs).toBeGreaterThanOrEqual(0);
      expect(snapshot.summaries[0]).not.toHaveProperty("frames");
    });
    expect(screen.getByRole("img", { name: /momo sprout planter/i })).toBeInTheDocument();
    repository.close();
  });

  it("awards one seed for a minute of focus and one more for a completed quick review", () => {
    expect(deriveGardenPlant(summary()).seeds).toBe(1);
    expect(deriveGardenPlant(summary({ quickReviewCompleted: true })).seeds).toBe(2);
    expect(
      deriveGardenPlant(summary({ elapsedMs: 30_000, quickReviewCompleted: true })).seeds,
    ).toBe(1);

    const garden = deriveGarden([
      summary({ startedAtMs: 1_000, finishedAtMs: 61_000 }),
      summary({
        sessionId: "session-old",
        startedAtMs: 86_400_000,
        finishedAtMs: 86_460_000,
        quickReviewCompleted: true,
      }),
    ]);
    expect(garden.totalSeeds).toBe(3);
    expect(garden.plants.map((plant) => plant.seeds)).toEqual([1, 2]);
  });

  it("requires typed confirmation and announces successful local deletion", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    render(<App repository={repository} />);

    fireEvent.click(screen.getByRole("button", { name: "More study tools" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete my data" }));
    const deleteButton = screen.getByRole("button", { name: "Delete all local data" });
    expect(deleteButton).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Type DELETE LOCAL DATA" }), {
      target: { value: "DELETE LOCAL DATA" },
    });
    expect(deleteButton).toBeEnabled();
    fireEvent.click(deleteButton);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/local data was deleted/i),
    );
    await expect(repository.load()).resolves.toMatchObject({
      active: null,
      decks: [],
      summaries: [],
    });
    repository.close();
  });

  it("keeps settings out of daily setup while persisting resettable defaults", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    render(<App repository={repository} />);

    await waitFor(() =>
      expect(screen.queryByText(/Restoring your local session/i)).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Default duration"), {
      target: { value: String(50 * 60_000) },
    });
    fireEvent.change(screen.getByLabelText("Sensitivity preset"), {
      target: { value: "strict" },
    });
    fireEvent.click(screen.getByLabelText("Prefer reduced motion"));

    await waitFor(async () => {
      await expect(repository.load()).resolves.toMatchObject({
        preferences: { durationMs: 50 * 60_000, preset: "strict", reducedMotion: true },
      });
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset defaults" }));
    expect(screen.getByLabelText("Sensitivity preset")).toHaveValue("balanced");
    expect(screen.getByLabelText("Prefer reduced motion")).not.toBeChecked();
    repository.close();
  });
});
