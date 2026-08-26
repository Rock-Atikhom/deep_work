import type { ExtensionMessage, ExtensionResponse } from "./messages";
import { requestCourseOriginAccess } from "./course-origin-permission";
import { courseGuardOriginFromUrl } from "../../src/course-guard/bridge-contract";
import { popupViewModel } from "./popup-view";

const statusElement = document.querySelector<HTMLParagraphElement>("#status");
const courseElement = document.querySelector<HTMLElement>("#course");
const progressElement = document.querySelector<HTMLElement>("#progress");
const companionElement = document.querySelector<HTMLElement>(".companion");
const messageElement = document.querySelector<HTMLParagraphElement>("#message");
const toggleElement = document.querySelector<HTMLButtonElement>("#toggle");
const openPlazaElement = document.querySelector<HTMLButtonElement>("#open-plaza");

if (
  !statusElement ||
  !courseElement ||
  !progressElement ||
  !companionElement ||
  !messageElement ||
  !toggleElement ||
  !openPlazaElement
) {
  throw new Error("Course Guard popup is missing its controls.");
}

const status = statusElement;
const course = courseElement;
const progress = progressElement;
const companion = companionElement;
const message = messageElement;
const toggle = toggleElement;
const openPlaza = openPlazaElement;

function showState(response: Extract<ExtensionResponse, { ok: true }>): void {
  const view = popupViewModel(response.state);
  course.textContent = view.courseLabel;
  status.textContent = view.status;
  progress.textContent = view.progressLabel;
  companion.dataset.mood = view.companionMood;
  toggle.textContent = view.primaryLabel;
  toggle.dataset.active = String(view.primaryAction === "stop");
  toggle.dataset.action = view.primaryAction;
  toggle.disabled = false;
}

async function send(messageToSend: ExtensionMessage): Promise<void> {
  toggle.disabled = true;
  message.textContent = "";
  try {
    const response = await chrome.runtime.sendMessage<ExtensionResponse>(messageToSend);
    if (response.ok) showState(response);
    else {
      message.textContent = response.message;
      toggle.disabled = false;
    }
  } catch {
    message.textContent = "The extension could not reach its background worker.";
    toggle.disabled = false;
  }
}

async function activeTabUrl(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab?.url ?? null;
}

toggle.addEventListener("click", () => {
  if (toggle.dataset.action === "stop") {
    void send({ type: "STOP_GUARD" });
    return;
  }
  if (toggle.dataset.action === "return") {
    void send({ type: "RETURN_TO_COURSE" });
    return;
  }
  void startFromPopup();
});

async function startFromPopup(): Promise<void> {
  toggle.disabled = true;
  message.textContent = "";
  try {
    // Chrome only opens the origin prompt for gestures inside the extension
    // itself, so the permission request happens HERE — never via the worker.
    const stateResponse = await chrome.runtime.sendMessage<ExtensionResponse>({
      type: "GET_STATE",
    });
    if (!stateResponse?.ok) throw new Error("state unavailable");

    const saved = stateResponse.state;
    const courseUrl =
      saved.phase === "permission-lost" && saved.courseUrl ? saved.courseUrl : await activeTabUrl();
    if (!courseUrl) {
      message.textContent = "Open your online course before starting the guard.";
      toggle.disabled = false;
      return;
    }
    const courseOrigin = courseGuardOriginFromUrl(courseUrl);
    if (!courseOrigin) {
      message.textContent = "Open your online course before starting the guard.";
      toggle.disabled = false;
      return;
    }

    const granted = await requestCourseOriginAccess(chrome.permissions, courseOrigin);
    if (!granted) {
      message.textContent =
        "Course access was declined. It is needed to detect when you leave the course website.";
      toggle.disabled = false;
      return;
    }

    const response = await chrome.runtime.sendMessage<ExtensionResponse>({
      type: "START_GUARD",
      courseUrl,
    });
    if (response?.ok) showState(response);
    else {
      message.textContent =
        response?.message ?? "The extension could not reach its background worker.";
      toggle.disabled = false;
    }
  } catch {
    message.textContent = "The extension could not reach its background worker.";
    toggle.disabled = false;
  }
}

openPlaza.addEventListener("click", () => {
  void chrome.tabs.create({ url: "https://rock-atikhom.github.io/deep_work/#/plaza" });
});

void send({ type: "GET_STATE" });
