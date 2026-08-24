import { describe, expect, it } from "vitest";
import { createGuardState } from "./guard-machine";
import { popupViewModel } from "./popup-view";

describe("Course Guard popup view", () => {
  it("shows a ready companion before a course is selected", () => {
    expect(popupViewModel(createGuardState())).toMatchObject({
      companionMood: "ready",
      primaryAction: "start",
      primaryLabel: "Start guard",
    });
  });

  it("shows a focusing companion while the course is protected", () => {
    expect(
      popupViewModel({
        ...createGuardState(),
        courseOrigin: "https://learn.example.com",
        courseUrl: "https://learn.example.com/lesson",
        phase: "watching",
        returnCount: 2,
        interruptionCount: 3,
      }),
    ).toMatchObject({
      companionMood: "focusing",
      courseLabel: "learn.example.com",
      primaryAction: "stop",
      progressLabel: "2 returns · 3 interruptions",
    });
  });

  it("offers a return action when a distraction is active", () => {
    expect(popupViewModel({ ...createGuardState(), phase: "interruption" })).toMatchObject({
      companionMood: "encouraging",
      primaryAction: "return",
      primaryLabel: "Back to course",
    });
  });
});
