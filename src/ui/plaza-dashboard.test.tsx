import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createInitialPlazaState } from "../plaza/plaza-machine";
import { PlazaHomeScreen } from "./screens/PlazaHomeScreen";
import { SessionArchiveScreen } from "./screens/SessionArchiveScreen";
import { WardrobeScreen } from "./screens/WardrobeScreen";

describe("Learning Plaza dashboard", () => {
  it("renders the plaza home with the companion, primary action, and destinations", () => {
    render(
      <PlazaHomeScreen
        companion={createInitialPlazaState().companion}
        connection="connected"
        guardPhase="idle"
        onStartFocus={() => undefined}
        recentSessions={[]}
      />,
    );

    expect(screen.getByRole("heading", { name: /learning plaza/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start a focus session/i })).toBeInTheDocument();
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
