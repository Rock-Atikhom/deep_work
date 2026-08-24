import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialPlazaState } from "../plaza/plaza-machine";
import { PlazaHomeScreen } from "./screens/PlazaHomeScreen";
import { SessionArchiveScreen } from "./screens/SessionArchiveScreen";
import { WardrobeScreen } from "./screens/WardrobeScreen";

describe("Learning Plaza dashboard", () => {
  it("renders the game HUD, care actions, and Course Guard map entry", () => {
    const onCare = vi.fn();
    const onStartFocus = vi.fn();
    render(
      <PlazaHomeScreen
        companion={createInitialPlazaState().companion}
        connection="connected"
        guardPhase="idle"
        onCare={onCare}
        onStartFocus={onStartFocus}
        recentSessions={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Feed Momo" }));
    fireEvent.click(screen.getByRole("button", { name: "Study with Momo" }));

    expect(screen.getByRole("heading", { name: "Momo's Plaza" })).toBeInTheDocument();
    expect(screen.getByText(/Level 1/i)).toBeInTheDocument();
    expect(onCare).toHaveBeenCalledWith("feed");
    expect(onStartFocus).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: /Course Guard/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Momo's Plaza map" })).toHaveClass(
      "momo-plaza-map",
    );
  });

  it("renders the Momo companion with the game map", () => {
    render(
      <PlazaHomeScreen
        companion={createInitialPlazaState().companion}
        connection="connected"
        guardPhase="idle"
        onCare={() => undefined}
        onStartFocus={() => undefined}
        recentSessions={[]}
      />,
    );

    expect(screen.getByRole("heading", { name: /momo's plaza/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /study with momo/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /course guard/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /momo, ready/i })).toBeInTheDocument();
  });

  it("shows an inviting empty archive and a locked wardrobe", () => {
    render(<SessionArchiveScreen sessions={[]} />);
    expect(screen.getByRole("heading", { name: /no sessions/i })).toBeInTheDocument();

    render(
      <WardrobeScreen companion={createInitialPlazaState().companion} onEquip={() => undefined} />,
    );
    expect(
      screen.getByRole("heading", { name: /make the town feel like yours/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Locked" }).length).toBeGreaterThan(0);
  });
});
