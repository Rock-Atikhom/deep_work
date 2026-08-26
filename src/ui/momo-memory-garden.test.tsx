import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialPlazaState } from "../plaza/plaza-machine";
import { MomoMemoryGarden } from "./screens/MomoMemoryGarden";

describe("MomoMemoryGarden", () => {
  it("renders Momo's archive, private Quest Log, and safe data controls", () => {
    const onExport = vi.fn();
    const onDelete = vi.fn();
    const onClearHistory = vi.fn();

    const { container } = render(
      <MomoMemoryGarden
        onClearHistory={onClearHistory}
        onDelete={onDelete}
        onExport={onExport}
        snapshot={{
          active: null,
          decks: [],
          garden: {
            plants: [
              {
                createdAtMs: 61_000,
                growth: 2,
                seeds: 1,
                sessionId: "core-1",
                stage: "leaf",
                subject: "SQL",
              },
            ],
            schemaVersion: 1,
            totalSeeds: 1,
          },
          plaza: {
            ...createInitialPlazaState(),
            courseGuardSessions: [
              {
                completionStatus: "completed" as const,
                courseLabel: "SQL",
                courseOrigin: "https://learn.example.com",
                elapsedMs: 25 * 60_000,
                finishedAtMs: 2_500,
                growthPoints: 25,
                id: "guard-1",
                returnCount: 1,
                rewardId: null,
                startedAtMs: 1_000,
              },
            ],
          },
          preferences: { durationMs: 1_500_000, selectedDeckId: null, sound: "silent" },
          schemaVersion: 1,
          summaries: [
            {
              awarenessCount: 0,
              durationMs: 1_500_000,
              elapsedMs: 60_000,
              finishedAtMs: 61_000,
              finishReason: "ended",
              goal: "Review joins",
              reflection: "yes",
              schemaVersion: 1,
              sessionId: "core-1",
              startedAtMs: 1_000,
              subject: "SQL",
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Momo's Memory Garden" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quest Log" })).toBeInTheDocument();
    expect(
      screen.getByText(/Only subjects, goals, timing, reflections, and session status/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText("SQL")).toHaveLength(2);
    const root = container.querySelector(".momo-memory-garden");
    expect(root).not.toBeNull();
    expect(root).not.toHaveClass("progress-shelf");
    expect(root?.querySelector(".momo-memory-garden-header")).not.toHaveClass("progress-header");
    expect(root?.querySelector(".momo-memory-garden-kicker")).not.toHaveClass("section-kicker");
    expect(root?.querySelector(".momo-sprout-count")).not.toHaveClass("garden-count");
    expect(root?.querySelector(".momo-collected-sprout-list")).not.toHaveClass("garden-list");
    expect(root?.querySelector(".momo-collected-sprout-stage")).not.toHaveClass("garden-stage");
    expect(root?.querySelector(".momo-empty-progress")).toBeNull();
    expect(root?.querySelector(".momo-device-keepsakes")).not.toHaveClass("data-actions");
    fireEvent.click(screen.getByRole("button", { name: "Export my data" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear session history" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete my data" }));
    expect(onExport).toHaveBeenCalledOnce();
    expect(onClearHistory).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("disables Clear session history when no Course Guard sessions exist", () => {
    const { getByRole } = render(
      <MomoMemoryGarden
        onClearHistory={() => undefined}
        onDelete={() => undefined}
        onExport={() => undefined}
        snapshot={{
          active: null,
          decks: [],
          garden: { plants: [], schemaVersion: 1, totalSeeds: 0 },
          plaza: createInitialPlazaState(),
          preferences: { durationMs: 1_500_000, selectedDeckId: null, sound: "silent" },
          schemaVersion: 1,
          summaries: [],
        }}
      />,
    );

    expect(getByRole("button", { name: "Clear session history" })).toBeDisabled();
  });
});
