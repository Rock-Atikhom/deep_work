import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GentleResetDialog } from "./components/GentleResetDialog";

describe("GentleResetDialog", () => {
  it("focuses Continue studying and treats Escape as continue", () => {
    const onContinue = vi.fn();
    render(
      <GentleResetDialog onContinue={onContinue} onNotes={vi.fn()} onQuickReview={vi.fn()} open />,
    );
    expect(screen.getByRole("button", { name: "Continue studying" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onContinue).toHaveBeenCalledOnce();
  });
});
