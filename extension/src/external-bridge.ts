import type { GuardState } from "./guard-machine";
import {
  COURSE_GUARD_PROTOCOL,
  COURSE_GUARD_PROTOCOL_VERSION,
  isApprovedWebAppOrigin,
  parseCourseGuardRequest,
  type BridgeErrorCode,
  type CourseGuardBridgeResponse,
  type CourseGuardRequest,
  type CourseGuardRequestValidation,
} from "../../src/course-guard/bridge-contract";

export type ExternalBridgeValidation =
  { ok: true; request: CourseGuardRequest } | { ok: false; code: BridgeErrorCode };

export function validateExternalBridgeMessage(
  senderUrl: string | undefined,
  message: unknown,
): ExternalBridgeValidation {
  if (!isApprovedWebAppOrigin(senderUrl)) return { ok: false, code: "unapproved-origin" };
  return parseCourseGuardRequest(message);
}

function messageForError(code: BridgeErrorCode): string {
  switch (code) {
    case "unapproved-origin":
      return "This web app origin is not allowed to connect to Course Guard.";
    case "unsupported-version":
      return "This web app uses an unsupported Course Guard protocol version.";
    case "invalid-protocol":
      return "This message is not for Course Guard.";
    case "invalid-course-url":
      return "Enter a valid HTTP(S) Course URL.";
    case "permission-needed":
      return "Allow Course Guard to access the selected course website from the extension popup.";
    case "guard-not-active":
      return "Course Guard is not active.";
    case "unknown-message":
      return "This Course Guard message is not supported.";
    case "unsupported-message":
      return "This Course Guard command is reserved for a later release.";
    case "malformed-message":
      return "This Course Guard message is malformed.";
    case "malformed-response":
      return "This Course Guard response is malformed.";
  }
}

export function createBridgeError(code: BridgeErrorCode): CourseGuardBridgeResponse {
  return {
    code,
    message: messageForError(code),
    protocol: COURSE_GUARD_PROTOCOL,
    type: "ERROR",
    version: COURSE_GUARD_PROTOCOL_VERSION,
  };
}

export function createHelloAck(state: GuardState): CourseGuardBridgeResponse {
  return {
    protocol: COURSE_GUARD_PROTOCOL,
    type: "HELLO_ACK",
    version: COURSE_GUARD_PROTOCOL_VERSION,
    state,
  };
}

export function createStateResponse(state: GuardState): CourseGuardBridgeResponse {
  return {
    protocol: COURSE_GUARD_PROTOCOL,
    type: "STATE",
    version: COURSE_GUARD_PROTOCOL_VERSION,
    state,
  };
}

export function validationError(
  validation: CourseGuardRequestValidation | ExternalBridgeValidation,
): CourseGuardBridgeResponse | null {
  return validation.ok ? null : createBridgeError(validation.code);
}
