import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialPlazaState } from "../plaza/plaza-machine";
import { SessionRewardScreen } from "./screens/SessionRewardScreen";

describe("SessionRewardScreen", () => {
  it("shows the earned reward and returns to Momo's Plaza", () => {
    const onReturnToPlaza = vi.fn();

    render(
      <SessionRewardScreen
        companion={{ ...createInitialPlazaState().companion, growthPoints: 25, mood: "proud" }}
        earnedGrowth={25}
        goal="Review joins"
        nextUnlock={{
          id: "hat-leaf",
          kind: "companion",
          label: "Leaf cap",
          requiredGrowthPoints: 50,
        }}
        onReturnToPlaza={onReturnToPlaza}
        reflection="Yes"
        rewardCount={1}
        savedLocally
        subject="SQL"
      />,
    );

    expect(screen.getByRole("heading", { name: /Momo is proud/i })).toBeInTheDocument();
    expect(screen.getByText("+25 growth")).toBeInTheDocument();
    expect(screen.getByText(/Next unlock: Leaf cap/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to Momo's Plaza" }));

    expect(onReturnToPlaza).toHaveBeenCalledOnce();
  });

  it("explains when every reward is unlocked and saving is session-only", () => {
    render(
      <SessionRewardScreen
        companion={createInitialPlazaState().companion}
        earnedGrowth={25}
        goal="Review joins"
        nextUnlock={null}
        onReturnToPlaza={vi.fn()}
        reflection="Yes"
        rewardCount={4}
        savedLocally={false}
        subject="SQL"
      />,
    );

    expect(screen.getByText("Every Plaza reward is unlocked.")).toBeInTheDocument();
    expect(screen.getByText(/available for this visit only/i)).toBeInTheDocument();
  });
});
