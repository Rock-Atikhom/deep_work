import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialPlazaState } from "../../plaza/plaza-machine";
import { MomoTownHallScreen } from "./MomoTownHallScreen";

describe("MomoTownHallScreen", () => {
  it("renders Momo's Mayor's Desk and forwards preference controls", () => {
    const onDurationChange = vi.fn();
    const onPresetChange = vi.fn();
    const onSoundChange = vi.fn();
    const onReducedMotionChange = vi.fn();
    const onReset = vi.fn();
    const onExportData = vi.fn();
    const onDeleteData = vi.fn();

    render(
      <MomoTownHallScreen
        companion={createInitialPlazaState().companion}
        connection="connected"
        dataStatus="Your local data was deleted from this device."
        durationMs={25 * 60_000}
        onDeleteData={onDeleteData}
        onDurationChange={onDurationChange}
        onExportData={onExportData}
        onPresetChange={onPresetChange}
        onReducedMotionChange={onReducedMotionChange}
        onReset={onReset}
        onSoundChange={onSoundChange}
        preset="balanced"
        reducedMotion={false}
        sound="standard"
      />,
    );

    fireEvent.change(screen.getByLabelText("Next session length"), {
      target: { value: String(50 * 60_000) },
    });
    fireEvent.change(screen.getByLabelText("Momo's focus sensitivity"), {
      target: { value: "strict" },
    });
    fireEvent.change(screen.getByLabelText("Focus chime"), { target: { value: "soft" } });
    fireEvent.click(screen.getByLabelText("Use gentler motion"));
    fireEvent.click(screen.getByRole("button", { name: "Reset defaults" }));
    fireEvent.click(screen.getByRole("button", { name: "Export my data" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete my data" }));

    expect(screen.getByRole("heading", { name: "Momo's Town Hall" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Momo, encouraging/i })).toBeInTheDocument();
    expect(screen.getByText("Extension connected")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your local data was deleted from this device.",
    );
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "#/privacy",
    );
    expect(screen.getByRole("link", { name: "Terms of Use" })).toHaveAttribute("href", "#/terms");
    expect(onDurationChange).toHaveBeenCalledWith(50 * 60_000);
    expect(onPresetChange).toHaveBeenCalledWith("strict");
    expect(onSoundChange).toHaveBeenCalledWith("soft");
    expect(onReducedMotionChange).toHaveBeenCalledWith(true);
    expect(onReset).toHaveBeenCalledOnce();
    expect(onExportData).toHaveBeenCalledOnce();
    expect(onDeleteData).toHaveBeenCalledOnce();
  });
});
