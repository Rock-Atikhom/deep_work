import {
  COURSE_GUARD_BRIDGE_NAME,
  COURSE_GUARD_PROTOCOL,
  COURSE_GUARD_PROTOCOL_VERSION,
  isCourseGuardCourseUrl,
  parseCourseGuardResponse,
  type BridgeErrorCode,
  type CourseGuardRequest,
  type CourseGuardBridgeResponse,
  type CourseGuardSnapshot,
} from "./bridge-contract";

export type CourseGuardBridgeEvent =
  | { type: "connection"; status: "connected" | "disconnected"; reason?: string }
  | { type: "state"; state: CourseGuardSnapshot };

export interface CourseGuardBridge {
  connect(listener: (event: CourseGuardBridgeEvent) => void): () => void;
  startGuard(courseUrl: string): Promise<CourseGuardCommandResult>;
  stopGuard(): Promise<CourseGuardCommandResult>;
}

type CourseGuardCommandErrorCode =
  | "disconnected"
  | Extract<
      BridgeErrorCode,
      "guard-not-active" | "invalid-course-url" | "permission-needed" | "unsupported-message"
    >;

export type CourseGuardCommandResult =
  | { ok: true; state: CourseGuardSnapshot }
  | {
      ok: false;
      code: CourseGuardCommandErrorCode;
      message: string;
    };

export interface ExternalBridgePort {
  onDisconnect: { addListener(listener: () => void): void };
  onMessage: { addListener(listener: (message: unknown) => void): void };
  postMessage(message: unknown): void;
  disconnect(): void;
}

export interface ExternalBridgeRuntime {
  connect(extensionId: string, connectInfo: { name: string }): ExternalBridgePort;
}

type ChromeBridgeOptions = {
  extensionId?: string;
  runtime?: ExternalBridgeRuntime;
};

function browserRuntime(): ExternalBridgeRuntime | undefined {
  const browser = (
    globalThis as typeof globalThis & {
      chrome?: { runtime?: ExternalBridgeRuntime };
    }
  ).chrome;
  return browser?.runtime;
}

function extensionIdFromBuild(): string | undefined {
  const configuredId = import.meta.env.VITE_COURSE_GUARD_EXTENSION_ID;
  return typeof configuredId === "string" && configuredId.length > 0 ? configuredId : undefined;
}

export function createChromeCourseGuardBridge(
  options: ChromeBridgeOptions = {},
): CourseGuardBridge {
  const extensionId = options.extensionId ?? extensionIdFromBuild();
  const runtime = options.runtime ?? browserRuntime();
  let sendCommand: ((request: CourseGuardRequest) => Promise<CourseGuardCommandResult>) | undefined;

  function disconnected(): CourseGuardCommandResult {
    return {
      code: "disconnected",
      message: "The Course Guard extension is disconnected.",
      ok: false,
    };
  }

  function invalidCourseUrl(): CourseGuardCommandResult {
    return {
      code: "invalid-course-url",
      message: "Enter a valid HTTP(S) Course URL.",
      ok: false,
    };
  }

  return {
    connect(listener) {
      let closed = false;
      let acknowledged = false;
      let port: ExternalBridgePort | undefined;
      let pendingCommand: { resolve: (result: CourseGuardCommandResult) => void } | undefined;

      const emitDisconnected = (reason: string) => {
        if (!closed) listener({ reason, status: "disconnected", type: "connection" });
        pendingCommand?.resolve(disconnected());
        pendingCommand = undefined;
      };

      if (!extensionId || !runtime) {
        sendCommand = undefined;
        return () => undefined;
      }

      try {
        port = runtime.connect(extensionId, { name: COURSE_GUARD_BRIDGE_NAME });
      } catch {
        emitDisconnected("connect-failed");
        sendCommand = undefined;
        return () => {
          closed = true;
        };
      }

      sendCommand = (request) => {
        if (closed || !acknowledged || !port) return Promise.resolve(disconnected());
        if (pendingCommand) {
          return Promise.resolve({
            code: "unsupported-message",
            message: "Course Guard is already processing a command.",
            ok: false,
          });
        }

        return new Promise<CourseGuardCommandResult>((resolve) => {
          pendingCommand = { resolve };
          try {
            port?.postMessage(request);
          } catch {
            emitDisconnected("send-failed");
          }
        });
      };

      port.onMessage.addListener((message) => {
        if (closed) return;
        const parsed = parseCourseGuardResponse(message);
        if (!parsed.ok) {
          emitDisconnected("protocol-error");
          return;
        }

        const response: CourseGuardBridgeResponse = parsed.response;
        if (response.type === "HELLO_ACK") {
          acknowledged = true;
          listener({ status: "connected", type: "connection" });
          listener({ state: response.state, type: "state" });
          return;
        }

        if (response.type === "STATE") {
          if (!acknowledged) {
            emitDisconnected("state-before-handshake");
            return;
          }
          listener({ state: response.state, type: "state" });
          const pending = pendingCommand;
          pendingCommand = undefined;
          pending?.resolve({ ok: true, state: response.state });
          return;
        }

        const pending = pendingCommand;
        pendingCommand = undefined;
        if (pending) {
          const commandCode: CourseGuardCommandErrorCode =
            response.code === "guard-not-active" ||
            response.code === "invalid-course-url" ||
            response.code === "permission-needed" ||
            response.code === "unsupported-message"
              ? response.code
              : "unsupported-message";
          pending.resolve({ code: commandCode, message: response.message, ok: false });
        }
      });

      port.onDisconnect.addListener(() => emitDisconnected("closed"));
      port.postMessage({
        protocol: COURSE_GUARD_PROTOCOL,
        type: "HELLO",
        version: COURSE_GUARD_PROTOCOL_VERSION,
      });

      return () => {
        pendingCommand?.resolve(disconnected());
        pendingCommand = undefined;
        closed = true;
        sendCommand = undefined;
        port?.disconnect();
      };
    },
    startGuard(courseUrl) {
      if (!isCourseGuardCourseUrl(courseUrl)) return Promise.resolve(invalidCourseUrl());
      return (
        sendCommand?.({
          courseUrl,
          protocol: COURSE_GUARD_PROTOCOL,
          type: "START_GUARD",
          version: COURSE_GUARD_PROTOCOL_VERSION,
        }) ?? Promise.resolve(disconnected())
      );
    },
    stopGuard() {
      return (
        sendCommand?.({
          protocol: COURSE_GUARD_PROTOCOL,
          type: "STOP_GUARD",
          version: COURSE_GUARD_PROTOCOL_VERSION,
        }) ?? Promise.resolve(disconnected())
      );
    },
  };
}
