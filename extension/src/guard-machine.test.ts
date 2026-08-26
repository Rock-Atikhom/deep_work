import { describe, expect, it } from "vitest";
import { courseUrlForStartAttempt, createGuardState, reduceGuard } from "./guard-machine";

describe("online learning guard", () => {
  it("interrupts when the learner leaves the course and resumes on return", () => {
    let state = createGuardState();

    state = reduceGuard(state, {
      atMs: 1_000,
      type: "START",
      courseUrl: "https://learn.example.com/course/lesson-1",
      tabId: 4,
    });
    expect(state.phase).toBe("watching");

    state = reduceGuard(state, {
      tabId: 7,
      type: "ACTIVE_TAB_CHANGED",
      url: "https://social.example.com/feed",
    });
    expect(state.phase).toBe("interruption");
    expect(state.interruptionCount).toBe(1);

    state = reduceGuard(state, {
      tabId: 8,
      type: "ACTIVE_TAB_CHANGED",
      url: "https://learn.example.com/course/lesson-2",
    });
    expect(state.phase).toBe("watching");
    expect(state.returnCount).toBe(1);
    expect(state.latestInCourseTabId).toBe(8);
    expect(state.latestInCourseUrl).toBe("https://learn.example.com/course/lesson-2");
  });

  it("records the latest in-course URL and counts each interruption-to-course return once", () => {
    let state = reduceGuard(createGuardState(), {
      atMs: 1_000,
      courseUrl: "https://learn.example.com/lesson/1",
      tabId: 4,
      type: "START",
    });
    state = reduceGuard(state, {
      tabId: 7,
      url: "https://social.example.com",
      type: "ACTIVE_TAB_CHANGED",
    });
    state = reduceGuard(state, {
      tabId: 8,
      url: "https://learn.example.com/lesson/2",
      type: "ACTIVE_TAB_CHANGED",
    });

    expect(state).toMatchObject({
      phase: "watching",
      interruptionCount: 1,
      returnCount: 1,
      latestInCourseTabId: 8,
      latestInCourseUrl: "https://learn.example.com/lesson/2",
    });
  });

  it("creates an incomplete session when permission is revoked", () => {
    const started = reduceGuard(createGuardState(), {
      atMs: 1_000,
      courseUrl: "https://learn.example.com/lesson/1",
      tabId: 4,
      type: "START",
    });
    const lost = reduceGuard(started, { atMs: 2_000, type: "PERMISSION_REVOKED" });
    expect(lost.phase).toBe("permission-lost");
    expect(lost.lastSession).toMatchObject({ completionStatus: "incomplete", finishedAtMs: 2_000 });
  });

  it("keeps the latest in-course URL when returning with the explicit action", () => {
    let state = reduceGuard(createGuardState(), {
      atMs: 1_000,
      courseUrl: "https://learn.example.com/lesson/1",
      tabId: 4,
      type: "START",
    });
    state = reduceGuard(state, {
      tabId: 7,
      type: "ACTIVE_TAB_CHANGED",
      url: "https://social.example.com",
    });
    state = reduceGuard(state, { type: "RETURN_TO_COURSE" });
    expect(state).toMatchObject({ phase: "watching", returnCount: 1 });
  });

  it("reuses the saved course URL when retrying a permission-lost start", () => {
    const permissionLost = {
      ...createGuardState(),
      courseOrigin: "https://learn.example.com",
      courseUrl: "https://learn.example.com/course/lesson-1",
      phase: "permission-lost" as const,
    };

    expect(courseUrlForStartAttempt(permissionLost, "https://unrelated.example.net/page")).toBe(
      "https://learn.example.com/course/lesson-1",
    );
  });

  it("prefers an explicit course URL, then falls back to the active tab", () => {
    const idle = createGuardState();

    expect(
      courseUrlForStartAttempt(
        idle,
        "https://active.example.com/page",
        "https://course.example.com",
      ),
    ).toBe("https://course.example.com");
    expect(courseUrlForStartAttempt(idle, "https://active.example.com/page")).toBe(
      "https://active.example.com/page",
    );
    expect(courseUrlForStartAttempt(idle, null)).toBeNull();
  });
});
