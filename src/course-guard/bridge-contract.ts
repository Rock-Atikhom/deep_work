export const COURSE_GUARD_PROTOCOL = "deep-work-course-guard" as const;
export const COURSE_GUARD_PROTOCOL_VERSION = 1 as const;
export const COURSE_GUARD_BRIDGE_NAME = "deep-work-course-guard" as const;

export const APPROVED_WEB_APP_ORIGINS = [
  "https://rock-atikhom.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
] as const;

export type CourseGuardPhase = "idle" | "watching" | "interruption" | "permission-lost";

export interface CourseGuardSessionSnapshot {
  completionStatus: "completed" | "incomplete";
  courseOrigin: string;
  courseUrl: string;
  elapsedMs: number;
  finishedAtMs: number;
  id: string;
  returnCount: number;
  startedAtMs: number;
}

export interface CourseGuardSnapshot {
  courseOrigin: string | null;
  courseUrl: string | null;
  interruptionCount: number;
  latestInCourseTabId: number | null;
  latestInCourseUrl: string | null;
  lastSession: CourseGuardSessionSnapshot | null;
  phase: CourseGuardPhase;
  returnCount: number;
  sessionId: string | null;
  sessionStartedAtMs: number | null;
}

type CourseGuardMessageBase = {
  protocol: typeof COURSE_GUARD_PROTOCOL;
  version: typeof COURSE_GUARD_PROTOCOL_VERSION;
};

export type CourseGuardRequest =
  | (CourseGuardMessageBase & { type: "HELLO" })
  | (CourseGuardMessageBase & { type: "GET_STATE" })
  | (CourseGuardMessageBase & { type: "START_GUARD"; courseUrl: string })
  | (CourseGuardMessageBase & { type: "STOP_GUARD" });

export type CourseGuardBridgeResponse =
  | (CourseGuardMessageBase & { type: "HELLO_ACK"; state: CourseGuardSnapshot })
  | (CourseGuardMessageBase & { type: "STATE"; state: CourseGuardSnapshot })
  | (CourseGuardMessageBase & {
      type: "ERROR";
      code: BridgeErrorCode;
      message: string;
    });

export type BridgeErrorCode =
  | "invalid-protocol"
  | "invalid-course-url"
  | "guard-not-active"
  | "malformed-message"
  | "malformed-response"
  | "permission-needed"
  | "unknown-message"
  | "unapproved-origin"
  | "unsupported-message"
  | "unsupported-version";

export type CourseGuardRequestValidation =
  | { ok: true; request: CourseGuardRequest }
  | { ok: false; code: Exclude<BridgeErrorCode, "malformed-response" | "unapproved-origin"> };

export type CourseGuardResponseValidation =
  { ok: true; response: CourseGuardBridgeResponse } | { ok: false; code: "malformed-response" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

export function isCourseGuardCourseUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function courseGuardOriginFromUrl(value: string): string | null {
  if (!isCourseGuardCourseUrl(value)) return null;
  return new URL(value).origin;
}

export function isApprovedWebAppOrigin(senderUrl: string | undefined): boolean {
  if (!senderUrl) return false;
  try {
    return APPROVED_WEB_APP_ORIGINS.includes(
      new URL(senderUrl).origin as (typeof APPROVED_WEB_APP_ORIGINS)[number],
    );
  } catch {
    return false;
  }
}

export function isCourseGuardSnapshot(value: unknown): value is CourseGuardSnapshot {
  if (!isRecord(value)) return false;
  const session = value.lastSession;
  const validSession =
    session === null ||
    (isRecord(session) &&
      (session.completionStatus === "completed" || session.completionStatus === "incomplete") &&
      typeof session.courseOrigin === "string" &&
      typeof session.courseUrl === "string" &&
      typeof session.elapsedMs === "number" &&
      Number.isFinite(session.elapsedMs) &&
      session.elapsedMs >= 0 &&
      typeof session.finishedAtMs === "number" &&
      Number.isFinite(session.finishedAtMs) &&
      session.finishedAtMs >= 0 &&
      typeof session.id === "string" &&
      typeof session.returnCount === "number" &&
      Number.isFinite(session.returnCount) &&
      session.returnCount >= 0 &&
      typeof session.startedAtMs === "number" &&
      Number.isFinite(session.startedAtMs) &&
      session.startedAtMs >= 0);
  return (
    (value.phase === "idle" ||
      value.phase === "watching" ||
      value.phase === "interruption" ||
      value.phase === "permission-lost") &&
    (value.courseOrigin === null || typeof value.courseOrigin === "string") &&
    (value.courseUrl === null || typeof value.courseUrl === "string") &&
    typeof value.interruptionCount === "number" &&
    Number.isFinite(value.interruptionCount) &&
    value.interruptionCount >= 0 &&
    (value.latestInCourseTabId === null ||
      (typeof value.latestInCourseTabId === "number" &&
        Number.isInteger(value.latestInCourseTabId))) &&
    (value.latestInCourseUrl === null || typeof value.latestInCourseUrl === "string") &&
    validSession &&
    typeof value.returnCount === "number" &&
    Number.isFinite(value.returnCount) &&
    value.returnCount >= 0 &&
    (value.sessionId === null || typeof value.sessionId === "string") &&
    (value.sessionStartedAtMs === null ||
      (typeof value.sessionStartedAtMs === "number" &&
        Number.isFinite(value.sessionStartedAtMs) &&
        value.sessionStartedAtMs >= 0))
  );
}

export function parseCourseGuardRequest(value: unknown): CourseGuardRequestValidation {
  if (!isRecord(value)) return { ok: false, code: "malformed-message" };
  if (value.protocol === undefined || value.version === undefined || value.type === undefined) {
    return { ok: false, code: "malformed-message" };
  }
  if (value.protocol !== COURSE_GUARD_PROTOCOL) return { ok: false, code: "invalid-protocol" };
  if (value.version !== COURSE_GUARD_PROTOCOL_VERSION) {
    return { ok: false, code: "unsupported-version" };
  }
  if (typeof value.type !== "string") return { ok: false, code: "malformed-message" };

  switch (value.type) {
    case "HELLO":
      return hasOnlyKeys(value, ["protocol", "version", "type"])
        ? { ok: true, request: value as CourseGuardRequest }
        : { ok: false, code: "malformed-message" };
    case "GET_STATE":
      return hasOnlyKeys(value, ["protocol", "version", "type"])
        ? { ok: true, request: value as CourseGuardRequest }
        : { ok: false, code: "malformed-message" };
    case "STOP_GUARD":
      return hasOnlyKeys(value, ["protocol", "version", "type"])
        ? { ok: true, request: value as CourseGuardRequest }
        : { ok: false, code: "malformed-message" };
    case "START_GUARD":
      return hasOnlyKeys(value, ["protocol", "version", "type", "courseUrl"]) &&
        isCourseGuardCourseUrl(value.courseUrl)
        ? { ok: true, request: value as CourseGuardRequest }
        : { ok: false, code: "malformed-message" };
    default:
      return { ok: false, code: "unknown-message" };
  }
}

export function parseCourseGuardResponse(value: unknown): CourseGuardResponseValidation {
  if (!isRecord(value)) return { ok: false, code: "malformed-response" };
  if (
    value.protocol !== COURSE_GUARD_PROTOCOL ||
    value.version !== COURSE_GUARD_PROTOCOL_VERSION ||
    typeof value.type !== "string"
  ) {
    return { ok: false, code: "malformed-response" };
  }

  if (value.type === "HELLO_ACK" || value.type === "STATE") {
    if (
      !hasOnlyKeys(value, ["protocol", "version", "type", "state"]) ||
      !isCourseGuardSnapshot(value.state)
    ) {
      return { ok: false, code: "malformed-response" };
    }
    return { ok: true, response: value as CourseGuardBridgeResponse };
  }

  if (value.type === "ERROR") {
    if (
      !hasOnlyKeys(value, ["protocol", "version", "type", "code", "message"]) ||
      !isBridgeErrorCode(value.code) ||
      typeof value.message !== "string"
    ) {
      return { ok: false, code: "malformed-response" };
    }
    return { ok: true, response: value as CourseGuardBridgeResponse };
  }

  return { ok: false, code: "malformed-response" };
}

function isBridgeErrorCode(value: unknown): value is BridgeErrorCode {
  return (
    value === "invalid-protocol" ||
    value === "invalid-course-url" ||
    value === "guard-not-active" ||
    value === "malformed-message" ||
    value === "malformed-response" ||
    value === "permission-needed" ||
    value === "unknown-message" ||
    value === "unsupported-message" ||
    value === "unapproved-origin" ||
    value === "unsupported-version"
  );
}
