import "fake-indexeddb/auto";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { openDeepWorkRepository } from "../storage/repository";
import { App } from "./App";

function databaseName() {
  return `deep-work-deck-test-${crypto.randomUUID()}`;
}

describe("Question Deck setup", () => {
  it("lets a student select and edit the local sample deck", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    render(<App repository={repository} />);
    fireEvent.click(screen.getByRole("button", { name: "More study tools" }));

    await waitFor(() =>
      expect(screen.getByRole("option", { name: /SQL study prompts/ })).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Question Deck" }), {
      target: { value: "sample-sql" },
    });
    fireEvent.change(screen.getByLabelText("Deck name"), {
      target: { value: "SQL joins review" },
    });
    fireEvent.change(screen.getByLabelText("Question 1"), {
      target: { value: "How does an INNER JOIN filter rows?" },
    });
    fireEvent.change(screen.getByLabelText("Explanation 1"), {
      target: { value: "It keeps rows with matching keys on both sides." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save deck" }));

    await waitFor(async () => {
      const snapshot = await repository.load();
      expect(snapshot.preferences.selectedDeckId).toBe("sample-sql");
      expect(snapshot.decks[0]).toMatchObject({ id: "sample-sql", name: "SQL joins review" });
      expect(snapshot.decks[0]?.questions[0]).toMatchObject({
        explanation: "It keeps rows with matching keys on both sides.",
        prompt: "How does an INNER JOIN filter rows?",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "New deck" }));
    fireEvent.change(screen.getByLabelText("Deck name"), {
      target: { value: "Algorithms review" },
    });
    fireEvent.change(screen.getByLabelText("Deck subject"), {
      target: { value: "Algorithms" },
    });
    fireEvent.change(screen.getByLabelText("Question 1"), {
      target: { value: "What is a loop invariant?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save deck" }));
    await waitFor(() =>
      expect(screen.getByRole("option", { name: /Algorithms review/ })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    await waitFor(() =>
      expect(screen.queryByRole("option", { name: /Algorithms review/ })).not.toBeInTheDocument(),
    );
    repository.close();
  });

  it("reports a failed import without replacing the sample deck", async () => {
    const repository = await openDeepWorkRepository({ databaseName: databaseName() });
    render(<App repository={repository} />);
    fireEvent.click(screen.getByRole("button", { name: "More study tools" }));

    await waitFor(() => expect(screen.getByLabelText("Import Question Deck")).toBeInTheDocument());
    const input = screen.getByLabelText("Import Question Deck") as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(["{bad"], "broken.json", { type: "application/json" })] },
    });

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/valid JSON/i));
    await expect(repository.load()).resolves.toMatchObject({
      decks: [expect.objectContaining({ id: "sample-sql" })],
    });
    repository.close();
  });
});
