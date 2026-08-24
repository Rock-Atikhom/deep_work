import type { GuardState } from "./guard-machine";

export type ExtensionMessage =
  | { type: "GET_STATE" }
  | { type: "START_GUARD" }
  | { type: "STOP_GUARD" }
  | { type: "RETURN_TO_COURSE" };

export type ContentMessage =
  | { type: "SHOW_INTERRUPTION"; courseUrl: string; returnCount?: number }
  | { type: "HIDE_INTERRUPTION" };

export type ExtensionResponse =
  | { ok: true; state: GuardState }
  | {
      ok: false;
      code?: "invalid-course-url" | "permission-needed";
      message: string;
    };
