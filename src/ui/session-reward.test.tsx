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
});
