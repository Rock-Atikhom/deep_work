import type { ContentMessage } from "./messages";

const OVERLAY_ID = "deep-work-course-guard";
const STYLE_ID = "deep-work-course-guard-style";

function installStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${OVERLAY_ID} {
      --color-ink: #243347;
      --color-sky: #a9d8e8;
      --color-grass: #68a86e;
      --color-grass-dark: #2e6941;
      --color-sun: #ffd66b;
      --color-coral: #ef8e72;
      --color-panel: #fff7e9;
      align-items: center;
      background: rgba(36, 51, 71, 0.72);
      display: flex;
      inset: 0;
      justify-content: center;
      padding: 24px;
      position: fixed;
      z-index: 2147483647;
    }
    #${OVERLAY_ID} > div {
      background: var(--color-panel);
      border: 3px solid var(--color-ink);
      border-radius: 24px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
      color: var(--color-ink);
      font: 16px/1.5 "IBM Plex Sans", system-ui, sans-serif;
      max-width: 420px;
      padding: 28px;
      text-align: center;
    }
    #${OVERLAY_ID} .deep-work-companion {
      background: var(--color-coral);
      border: 3px solid var(--color-ink);
      border-radius: 42% 42% 48% 48%;
      height: 82px;
      margin: 0 auto 16px;
      position: relative;
      width: 82px;
    }
    #${OVERLAY_ID} .deep-work-companion::before,
    #${OVERLAY_ID} .deep-work-companion::after {
      background: var(--color-coral);
      border: 3px solid var(--color-ink);
      border-radius: 50% 50% 0 50%;
      content: "";
      height: 24px;
      position: absolute;
      top: -12px;
      width: 24px;
    }
    #${OVERLAY_ID} .deep-work-companion::before { left: 6px; transform: rotate(-15deg); }
    #${OVERLAY_ID} .deep-work-companion::after { right: 6px; transform: scaleX(-1) rotate(-15deg); }
    #${OVERLAY_ID} .deep-work-face {
      align-items: center;
      background: #ffe5c5;
      border: 3px solid var(--color-ink);
      border-radius: 50%;
      display: flex;
      gap: 14px;
      height: 44px;
      justify-content: center;
      left: 16px;
      position: absolute;
      top: 20px;
      width: 44px;
    }
    #${OVERLAY_ID} .deep-work-face::before,
    #${OVERLAY_ID} .deep-work-face::after {
      background: var(--color-ink);
      border-radius: 50%;
      content: "";
      height: 6px;
      width: 6px;
    }
    #${OVERLAY_ID} h1 { font: 600 38px/1.05 Newsreader, Georgia, serif; margin: 0 0 10px; }
    #${OVERLAY_ID} p { margin: 0 0 8px; }
    #${OVERLAY_ID} .deep-work-course { color: var(--color-grass-dark); font-weight: 700; }
    #${OVERLAY_ID} .deep-work-return-count { color: var(--color-grass-dark); font-size: 13px; margin-bottom: 22px; }
    #${OVERLAY_ID} button {
      background: var(--color-grass);
      border: 2px solid var(--color-grass-dark);
      border-radius: 12px;
      color: #fffdf5;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
      min-height: 48px;
      padding: 0 20px;
    }
    #${OVERLAY_ID} button:focus-visible { outline: 3px solid var(--color-coral); outline-offset: 4px; }
    @media (prefers-reduced-motion: reduce) {
      #${OVERLAY_ID} * { animation: none !important; transition: none !important; }
    }
  `;
  document.documentElement.append(style);
}

function hideInterruption(): void {
  document.getElementById(OVERLAY_ID)?.remove();
}

function courseLabel(courseUrl: string): string {
  try {
    return new URL(courseUrl).hostname;
  } catch {
    return "your course";
  }
}

function showInterruption(courseUrl: string, returnCount = 0): void {
  installStyles();
  hideInterruption();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", `${OVERLAY_ID}-title`);

  const panel = document.createElement("div");
  const companion = document.createElement("div");
  companion.className = "deep-work-companion";
  companion.setAttribute("aria-hidden", "true");
  const face = document.createElement("span");
  face.className = "deep-work-face";
  companion.append(face);

  const title = document.createElement("h1");
  title.id = `${OVERLAY_ID}-title`;
  title.textContent = "Momo is waiting";
  const message = document.createElement("p");
  message.textContent = `The scroll can wait. ${courseLabel(courseUrl)} is still open.`;
  const count = document.createElement("p");
  count.className = "deep-work-return-count";
  count.textContent =
    returnCount > 0
      ? `You have returned ${returnCount} time${returnCount === 1 ? "" : "s"}.`
      : "Your course is ready for you.";
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Back to course";
  button.addEventListener("click", () => {
    void chrome.runtime.sendMessage({ type: "RETURN_TO_COURSE" });
  });

  panel.append(companion, title, message, count, button);
  overlay.append(panel);
  document.documentElement.append(overlay);
  button.focus();
}

chrome.runtime.onMessage.addListener((message) => {
  if (!message || typeof message !== "object" || !("type" in message)) return;
  const contentMessage = message as ContentMessage;
  if (contentMessage.type === "SHOW_INTERRUPTION") {
    showInterruption(contentMessage.courseUrl, contentMessage.returnCount);
  }
  if (contentMessage.type === "HIDE_INTERRUPTION") hideInterruption();
});
