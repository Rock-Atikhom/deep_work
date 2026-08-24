import { describe, expect, it } from "vitest";
import { createGuardState } from "./guard-machine";
import {
  createBridgeError,
  createHelloAck,
  validateExternalBridgeMessage,
} from "./external-bridge";
import {
  COURSE_GUARD_PROTOCOL,
  COURSE_GUARD_PROTOCOL_VERSION,
} from "../../src/course-guard/bridge-contract";

const hello = {
  protocol: COURSE_GUARD_PROTOCOL,
  type: "HELLO" as const,
  version: COURSE_GUARD_PROTOCOL_VERSION,
};

describe("external Course Guard messages", () => {
  it("accepts a valid message from the published web app", () => {
    expect(
      validateExternalBridgeMessage("https://rock-atikhom.github.io/deep_work/", hello),
    ).toEqual({ ok: true, request: hello });
  });

  it("rejects a valid message from an unapproved sender", () => {
    expect(validateExternalBridgeMessage("https://example.com/", hello)).toMatchObject({
      ok: false,
      code: "unapproved-origin",
    });
  });

  it("rejects malformed and unknown messages before they reach a handler", () => {
    expect(
      validateExternalBridgeMessage("http://localhost:5173/", { type: "HELLO" }),
    ).toMatchObject({ ok: false, code: "malformed-message" });
    expect(
      validateExternalBridgeMessage("http://localhost:5173/", { ...hello, type: "UNKNOWN" }),
    ).toMatchObject({ ok: false, code: "unknown-message" });
  });

  it("returns a state-bearing acknowledgement without exposing page data", () => {
    expect(createHelloAck(createGuardState())).toEqual({
      protocol: COURSE_GUARD_PROTOCOL,
      type: "HELLO_ACK",
      version: COURSE_GUARD_PROTOCOL_VERSION,
      state: createGuardState(),
    });
  });

  it("creates a protocol error for rejected messages", () => {
    expect(createBridgeError("unapproved-origin")).toEqual({
      code: "unapproved-origin",
      message: "This web app origin is not allowed to connect to Course Guard.",
      protocol: COURSE_GUARD_PROTOCOL,
      type: "ERROR",
      version: COURSE_GUARD_PROTOCOL_VERSION,
    });
  });
});
