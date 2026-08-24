import { describe, expect, it } from "vitest";
import { createGuardState } from "../../extension/src/guard-machine";
import { COURSE_GUARD_PROTOCOL, COURSE_GUARD_PROTOCOL_VERSION } from "./bridge-contract";
import { createChromeCourseGuardBridge, type ExternalBridgePort } from "./bridge";

function createFakePort() {
  let messageListener: ((message: unknown) => void) | undefined;
  let disconnectListener: (() => void) | undefined;
  const posted: unknown[] = [];
  const port: ExternalBridgePort = {
    onDisconnect: {
      addListener(listener) {
        disconnectListener = listener;
      },
    },
    onMessage: {
      addListener(listener) {
        messageListener = listener;
      },
    },
    postMessage(message) {
      posted.push(message);
    },
    disconnect() {
      disconnectListener?.();
    },
  };

  return {
    emit(message: unknown) {
      messageListener?.(message);
    },
    port,
    posted,
  };
}

describe("Chrome Course Guard bridge", () => {
  it("does not report connected before the extension acknowledges the handshake", () => {
    const fakePort = createFakePort();
    const bridge = createChromeCourseGuardBridge({
      extensionId: "abcdefghijklmnopabcdefghijklmnop",
      runtime: { connect: () => fakePort.port },
    });
    const events: unknown[] = [];

    bridge.connect((event) => events.push(event));

    expect(events).toEqual([]);
    expect(fakePort.posted).toEqual([
      {
        protocol: COURSE_GUARD_PROTOCOL,
        type: "HELLO",
        version: COURSE_GUARD_PROTOCOL_VERSION,
      },
    ]);
  });

  it("reports connection and authoritative state only after a valid acknowledgement", () => {
    const fakePort = createFakePort();
    const bridge = createChromeCourseGuardBridge({
      extensionId: "abcdefghijklmnopabcdefghijklmnop",
      runtime: { connect: () => fakePort.port },
    });
    const events: unknown[] = [];

    bridge.connect((event) => events.push(event));
    fakePort.emit({
      protocol: COURSE_GUARD_PROTOCOL,
      type: "HELLO_ACK",
      version: COURSE_GUARD_PROTOCOL_VERSION,
      state: createGuardState(),
    });

    expect(events).toEqual([
      { status: "connected", type: "connection" },
      { state: createGuardState(), type: "state" },
    ]);
  });

  it("reports disconnected when the live channel closes or sends malformed data", () => {
    const fakePort = createFakePort();
    const bridge = createChromeCourseGuardBridge({
      extensionId: "abcdefghijklmnopabcdefghijklmnop",
      runtime: { connect: () => fakePort.port },
    });
    const events: unknown[] = [];

    bridge.connect((event) => events.push(event));
    fakePort.emit({ type: "not-a-course-guard-response" });
    fakePort.port.disconnect();

    expect(events).toEqual([
      { reason: "protocol-error", status: "disconnected", type: "connection" },
      { reason: "closed", status: "disconnected", type: "connection" },
    ]);
  });

  it("sends a selected course URL and waits for authoritative start state", async () => {
    const fakePort = createFakePort();
    const bridge = createChromeCourseGuardBridge({
      extensionId: "abcdefghijklmnopabcdefghijklmnop",
      runtime: { connect: () => fakePort.port },
    });
    bridge.connect(() => undefined);
    fakePort.emit({
      protocol: COURSE_GUARD_PROTOCOL,
      type: "HELLO_ACK",
      version: COURSE_GUARD_PROTOCOL_VERSION,
      state: createGuardState(),
    });

    const startResult = bridge.startGuard("https://learn.example.com/course/lesson-1");

    expect(fakePort.posted.at(-1)).toEqual({
      courseUrl: "https://learn.example.com/course/lesson-1",
      protocol: COURSE_GUARD_PROTOCOL,
      type: "START_GUARD",
      version: COURSE_GUARD_PROTOCOL_VERSION,
    });

    const watchingState = {
      ...createGuardState(),
      courseOrigin: "https://learn.example.com",
      courseUrl: "https://learn.example.com/course/lesson-1",
      phase: "watching" as const,
    };
    fakePort.emit({
      protocol: COURSE_GUARD_PROTOCOL,
      type: "STATE",
      version: COURSE_GUARD_PROTOCOL_VERSION,
      state: watchingState,
    });

    await expect(startResult).resolves.toEqual({ ok: true, state: watchingState });
  });

  it("returns permission-needed without pretending the guard started", async () => {
    const fakePort = createFakePort();
    const bridge = createChromeCourseGuardBridge({
      extensionId: "abcdefghijklmnopabcdefghijklmnop",
      runtime: { connect: () => fakePort.port },
    });
    bridge.connect(() => undefined);
    fakePort.emit({
      protocol: COURSE_GUARD_PROTOCOL,
      type: "HELLO_ACK",
      version: COURSE_GUARD_PROTOCOL_VERSION,
      state: createGuardState(),
    });

    const startResult = bridge.startGuard("https://learn.example.com/course/lesson-1");
    fakePort.emit({
      code: "permission-needed",
      message: "Course access is needed.",
      protocol: COURSE_GUARD_PROTOCOL,
      type: "ERROR",
      version: COURSE_GUARD_PROTOCOL_VERSION,
    });

    await expect(startResult).resolves.toEqual({
      code: "permission-needed",
      message: "Course access is needed.",
      ok: false,
    });
  });
});
