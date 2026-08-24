import type { GuardState } from "./guard-machine";

export interface PopupViewModel {
  companionMood: "resting" | "ready" | "focusing" | "encouraging";
  courseLabel: string;
  primaryAction: "start" | "stop" | "return";
  primaryLabel: string;
  progressLabel: string;
  status: string;
}

function courseLabel(state: GuardState): string {
  if (!state.courseOrigin) return "No course selected";
  try {
    return new URL(state.courseOrigin).hostname;
  } catch {
    return state.courseOrigin;
  }
}

export function popupViewModel(state: GuardState): PopupViewModel {
  if (state.phase === "watching") {
    return {
      companionMood: "focusing",
      courseLabel: courseLabel(state),
      primaryAction: "stop",
      primaryLabel: "Stop guard",
      progressLabel: `${state.returnCount} returns · ${state.interruptionCount} interruptions`,
      status: "Momo is keeping your course close.",
    };
  }
  if (state.phase === "interruption") {
    return {
      companionMood: "encouraging",
      courseLabel: courseLabel(state),
      primaryAction: "return",
      primaryLabel: "Back to course",
      progressLabel: `${state.returnCount} returns · ${state.interruptionCount} interruptions`,
      status: "Momo is waiting by the course door.",
    };
  }
  if (state.phase === "permission-lost") {
    return {
      companionMood: "encouraging",
      courseLabel: courseLabel(state),
      primaryAction: "start",
      primaryLabel: "Try again",
      progressLabel: "Course access needs your permission.",
      status: "Momo needs the course door reopened.",
    };
  }
  return {
    companionMood: "ready",
    courseLabel: "No course selected",
    primaryAction: "start",
    primaryLabel: "Start guard",
    progressLabel: "Open your course, then begin.",
    status: "Momo is ready when you are.",
  };
}
