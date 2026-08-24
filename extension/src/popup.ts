import type { ExtensionMessage, ExtensionResponse } from "./messages";
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

toggle.addEventListener("click", () => {
  const action = toggle.dataset.action ?? "start";
  void send(
    action === "stop"
      ? { type: "STOP_GUARD" }
      : action === "return"
        ? { type: "RETURN_TO_COURSE" }
        : { type: "START_GUARD" },
  );
});

openPlaza.addEventListener("click", () => {
  void chrome.tabs.create({ url: "https://rock-atikhom.github.io/deep_work/#/plaza" });
});

void send({ type: "GET_STATE" });
