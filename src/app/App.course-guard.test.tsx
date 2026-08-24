import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CourseGuardBridge, CourseGuardBridgeEvent } from "../course-guard/bridge";
import type { CourseGuardSnapshot } from "../course-guard/bridge-contract";
import { App } from "./App";

function createFakeBridge() {
  let listener: ((event: CourseGuardBridgeEvent) => void) | undefined;
  let state: CourseGuardSnapshot = idleState;
  const bridge: CourseGuardBridge = {
    connect(nextListener) {
      listener = nextListener;
      return () => {
        listener = undefined;
      };
    },
    async startGuard() {
      state = {
        ...idleState,
        courseOrigin: "https://learn.example.com",
        courseUrl: "https://learn.example.com/course/lesson-1",
        phase: "watching",
      };
      listener?.({ state, type: "state" });
      return { ok: true, state };
    },
    async stopGuard() {
      state = idleState;
      listener?.({ state, type: "state" });
      return { ok: true, state };
    },
  };

  return {
    bridge,
    emit(event: CourseGuardBridgeEvent) {
      listener?.(event);
    },
  };
}

const idleState: CourseGuardSnapshot = {
  courseOrigin: null,
  courseUrl: null,
  interruptionCount: 0,
  latestInCourseTabId: null,
  latestInCourseUrl: null,
  lastSession: null,
  phase: "idle",
  returnCount: 0,
  sessionId: null,
  sessionStartedAtMs: null,
};

describe("Course Guard connection in Learning Plaza", () => {
  it("shows disconnected until the injected bridge reports a connection", () => {
    const fakeBridge = createFakeBridge();
    render(<App courseGuardBridge={fakeBridge.bridge} />);

    expect(screen.getByLabelText("Course Guard connection status")).toHaveTextContent(
      "Extension disconnected",
    );

    act(() => {
      fakeBridge.emit({ status: "connected", type: "connection" });
      fakeBridge.emit({ state: idleState, type: "state" });
    });

    expect(screen.getByLabelText("Course Guard connection status")).toHaveTextContent(
      "Extension connected",
    );
  });

  it("does not turn a local study-session click into a false Guarding course state", () => {
    const fakeBridge = createFakeBridge();
    render(<App courseGuardBridge={fakeBridge.bridge} />);
    act(() => {
      fakeBridge.emit({ status: "connected", type: "connection" });
      fakeBridge.emit({ state: idleState, type: "state" });
    });

    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "SQL" } });
    fireEvent.change(screen.getByLabelText("Session goal"), { target: { value: "Review joins" } });
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));

    expect(screen.queryByText("Guarding course")).not.toBeInTheDocument();
  });

  it("keeps the Course Guard action disabled for an invalid URL", () => {
    const fakeBridge = createFakeBridge();
    render(<App courseGuardBridge={fakeBridge.bridge} />);
    act(() => {
      fakeBridge.emit({ status: "connected", type: "connection" });
      fakeBridge.emit({ state: idleState, type: "state" });
    });

    fireEvent.change(screen.getByLabelText("Course URL"), {
      target: { value: "javascript:alert(1)" },
    });
    fireEvent.change(screen.getByLabelText("Session goal"), {
      target: { value: "Review joins" },
    });

    expect(screen.getByRole("button", { name: "Start Course Guard" })).toBeDisabled();
  });

  it("shows guarding only after the bridge confirms start and returns to connected after stop", async () => {
    const fakeBridge = createFakeBridge();
    render(<App courseGuardBridge={fakeBridge.bridge} />);
    act(() => {
      fakeBridge.emit({ status: "connected", type: "connection" });
      fakeBridge.emit({ state: idleState, type: "state" });
    });

    fireEvent.change(screen.getByLabelText("Course URL"), {
      target: { value: "https://learn.example.com/course/lesson-1" },
    });
    fireEvent.change(screen.getByLabelText("Session goal"), {
      target: { value: "Review joins" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start Course Guard" }));

    expect(await screen.findByText("Guarding course")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop Course Guard" }));
    expect(await screen.findByText("Extension connected")).toBeInTheDocument();
  });

  it("shows Permission needed when the extension declines course access", async () => {
    const fakeBridge = createFakeBridge();
    fakeBridge.bridge.startGuard = async () => ({
      code: "permission-needed",
      message: "Allow course access from the extension popup.",
      ok: false,
    });
    render(<App courseGuardBridge={fakeBridge.bridge} />);
    act(() => {
      fakeBridge.emit({ status: "connected", type: "connection" });
      fakeBridge.emit({ state: idleState, type: "state" });
    });

    fireEvent.change(screen.getByLabelText("Course URL"), {
      target: { value: "https://learn.example.com/course/lesson-1" },
    });
    fireEvent.change(screen.getByLabelText("Session goal"), {
      target: { value: "Review joins" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start Course Guard" }));

    expect(await screen.findByText("Permission needed")).toBeInTheDocument();
    expect(screen.queryByText("Guarding course")).not.toBeInTheDocument();
  });

  it("turns a confirmed completed guard state into local companion growth", async () => {
    const fakeBridge = createFakeBridge();
    render(<App courseGuardBridge={fakeBridge.bridge} />);
    act(() => {
      fakeBridge.emit({ status: "connected", type: "connection" });
      fakeBridge.emit({ state: idleState, type: "state" });
    });

    fireEvent.change(screen.getByLabelText("Course URL"), {
      target: { value: "https://learn.example.com/course/lesson-1" },
    });
    fireEvent.change(screen.getByLabelText("Session goal"), {
      target: { value: "Review joins" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start Course Guard" }));

    act(() => {
      fakeBridge.emit({
        state: {
          ...idleState,
          courseOrigin: "https://learn.example.com",
          courseUrl: "https://learn.example.com/course/lesson-1",
          phase: "idle",
          lastSession: {
            completionStatus: "completed",
            courseOrigin: "https://learn.example.com",
            courseUrl: "https://learn.example.com/course/lesson-1",
            elapsedMs: 25 * 60_000,
            finishedAtMs: 26 * 60_000,
            id: "guard-1",
            returnCount: 1,
            startedAtMs: 60_000,
          },
          sessionId: null,
          sessionStartedAtMs: null,
        },
        type: "state",
      });
      window.location.hash = "#/plaza";
    });

    expect((await screen.findAllByText("25 growth")).length).toBeGreaterThan(0);
  });
});
