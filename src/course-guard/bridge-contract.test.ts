import { describe, expect, it } from "vitest";
import {
  COURSE_GUARD_BRIDGE_NAME,
  COURSE_GUARD_PROTOCOL,
  COURSE_GUARD_PROTOCOL_VERSION,
  isApprovedWebAppOrigin,
  isCourseGuardSnapshot,
  parseCourseGuardRequest,
  type CourseGuardRequest,
} from "./bridge-contract";

const hello: CourseGuardRequest = {
  protocol: COURSE_GUARD_PROTOCOL,
  type: "HELLO",
  version: COURSE_GUARD_PROTOCOL_VERSION,
};

describe("Course Guard bridge contract", () => {
  it("allows only the published app and approved local development origins", () => {
    expect(isApprovedWebAppOrigin("https://rock-atikhom.github.io/deep_work/")).toBe(true);
    expect(isApprovedWebAppOrigin("http://localhost:5173/")).toBe(true);
    expect(isApprovedWebAppOrigin("http://127.0.0.1:5173/")).toBe(true);
    expect(isApprovedWebAppOrigin("https://rock-atikhom.github.io.attacker.example/")).toBe(false);
    expect(isApprovedWebAppOrigin("http://localhost:5174/")).toBe(false);
  });

  it("accepts a versioned hello request", () => {
    expect(parseCourseGuardRequest(hello)).toEqual({ ok: true, request: hello });
  });

  it("rejects an unknown message type", () => {
    expect(
      parseCourseGuardRequest({
        ...hello,
        type: "OPEN_PAGE",
      }),
    ).toMatchObject({ ok: false, code: "unknown-message" });
  });

  it("rejects malformed payloads and unsupported protocol versions", () => {
    expect(parseCourseGuardRequest(null)).toMatchObject({ ok: false, code: "malformed-message" });
    expect(
      parseCourseGuardRequest({ ...hello, version: COURSE_GUARD_PROTOCOL_VERSION + 1 }),
    ).toMatchObject({ ok: false, code: "unsupported-version" });
    expect(parseCourseGuardRequest({ ...hello, protocol: "another-extension" })).toMatchObject({
      ok: false,
      code: "invalid-protocol",
    });
    expect(
      parseCourseGuardRequest({
        ...hello,
        type: "START_GUARD",
        courseUrl: "javascript:alert(1)",
      }),
    ).toMatchObject({ ok: false, code: "malformed-message" });
  });

  it("keeps the external connection name stable", () => {
    expect(COURSE_GUARD_BRIDGE_NAME).toBe("deep-work-course-guard");
  });

  it("accepts permission-lost snapshots with a recoverable incomplete session", () => {
    expect(
      isCourseGuardSnapshot({
        courseOrigin: "https://learn.example.com",
        courseUrl: "https://learn.example.com/lesson/1",
        interruptionCount: 1,
        latestInCourseTabId: 4,
        latestInCourseUrl: "https://learn.example.com/lesson/2",
        lastSession: {
          completionStatus: "incomplete",
          courseOrigin: "https://learn.example.com",
          courseUrl: "https://learn.example.com/lesson/1",
          elapsedMs: 1_000,
          finishedAtMs: 2_000,
          id: "guard-1",
          returnCount: 1,
          startedAtMs: 1_000,
        },
        phase: "permission-lost",
        returnCount: 1,
        sessionId: "guard-1",
        sessionStartedAtMs: 1_000,
      }),
    ).toBe(true);
  });

  it("rejects a snapshot with a negative return count", () => {
    expect(isCourseGuardSnapshot({ ...createGuardSnapshot(), returnCount: -1 })).toBe(false);
  });
});

function createGuardSnapshot() {
  return {
    courseOrigin: null,
    courseUrl: null,
    interruptionCount: 0,
    latestInCourseTabId: null,
    latestInCourseUrl: null,
    lastSession: null,
    phase: "idle" as const,
    returnCount: 0,
    sessionId: null,
    sessionStartedAtMs: null,
  };
}
