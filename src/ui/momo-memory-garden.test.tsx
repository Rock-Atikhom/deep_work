import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialPlazaState } from "../plaza/plaza-machine";
import { MomoMemoryGarden } from "./screens/MomoMemoryGarden";

describe("MomoMemoryGarden", () => {
  it("renders Momo's archive, private Quest Log, and safe data controls", () => {
    const onExport = vi.fn();
    const onDelete = vi.fn();

    render(
      <MomoMemoryGarden
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
          plaza: createInitialPlazaState(),
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
    fireEvent.click(screen.getByRole("button", { name: "Export my data" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete my data" }));
    expect(onExport).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
