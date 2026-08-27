import "fake-indexeddb/auto";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { openDeepWorkRepository } from "../storage/repository";
import { App } from "./App";

function databaseName() {
  return `deep-work-garden-test-${crypto.randomUUID()}`;
}

describe("Momo Memory Garden and local history", () => {
  it("shows growth and clears all local data without blocking a new session", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    render(<App repository={repository} />);

    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "SQL" } });
    fireEvent.change(screen.getByLabelText("Session goal"), { target: { value: "Review joins" } });
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));
    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Momo's Memory Garden" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("heading", { name: "Quest Log" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Review joins")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Ended early")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Delete my data" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/sessions, reflections, Learning Garden, and saved preferences/i),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Type DELETE LOCAL DATA" }), {
      target: { value: "DELETE LOCAL DATA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Delete all local data" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Make room for focused learning" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "More study tools" }));
    expect(
      screen.getByRole("heading", { name: "Your first sprout is waiting" }),
    ).toBeInTheDocument();
    await waitFor(async () => expect((await repository.load()).decks).toHaveLength(0));

    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "Math" } });
    fireEvent.change(screen.getByLabelText("Session goal"), {
      target: { value: "Practice limits" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));
    expect(screen.getByRole("heading", { name: "Focus Stage" })).toBeInTheDocument();
    repository.close();
  });
});
