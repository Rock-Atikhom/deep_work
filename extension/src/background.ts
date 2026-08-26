import {
  courseUrlForStartAttempt,
  createGuardState,
  reduceGuard,
  type GuardState,
} from "./guard-machine";
import {
  createBridgeError,
  createHelloAck,
  createStateResponse,
  validateExternalBridgeMessage,
} from "./external-bridge";
import {
  courseOriginPattern,
  removeCourseOriginAccess,
  requestCourseOriginAccess,
} from "./course-origin-permission";
import type { ContentMessage, ExtensionMessage, ExtensionResponse } from "./messages";
import type { CourseGuardBridgeResponse } from "../../src/course-guard/bridge-contract";
import {
  COURSE_GUARD_BRIDGE_NAME,
  isCourseGuardSnapshot,
  isApprovedWebAppOrigin,
} from "../../src/course-guard/bridge-contract";

const STORAGE_KEY = "guardState";
const externalPorts = new Set<ChromePort>();

async function loadState(): Promise<GuardState> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const value = stored[STORAGE_KEY];
  if (isGuardState(value)) return value;
  return createGuardState();
}

async function saveState(state: GuardState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
  await chrome.action.setBadgeText({
    text: state.phase === "interruption" || state.phase === "permission-lost" ? "!" : "",
  });
  const response = createStateResponse(state);
  for (const port of externalPorts) {
    try {
      port.postMessage(response);
    } catch {
      externalPorts.delete(port);
    }
  }
}

function isGuardState(value: unknown): value is GuardState {
  return isCourseGuardSnapshot(value);
}

async function activeTab(): Promise<ChromeTab | null> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab ?? null;
}

async function notifyTab(tabId: number | undefined, message: ContentMessage): Promise<void> {
  if (tabId === undefined) return;
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch {
    // Restricted browser pages do not accept content scripts.
  }
}

async function syncActiveTab(tab: ChromeTab): Promise<void> {
  if (tab.id === undefined || !tab.url) return;
  const state = await loadState();
  const next = reduceGuard(state, { tabId: tab.id, type: "ACTIVE_TAB_CHANGED", url: tab.url });
  await saveState(next);
  await notifyTab(
    tab.id,
    next.phase === "interruption"
      ? {
          type: "SHOW_INTERRUPTION",
          courseUrl: next.courseUrl ?? "",
          returnCount: next.returnCount,
        }
      : { type: "HIDE_INTERRUPTION" },
  );
}

async function startGuard(courseUrl?: string): Promise<ExtensionResponse> {
  const current = await loadState();
  const selectedTab = await activeTab();
  const selectedCourseUrl = courseUrlForStartAttempt(current, selectedTab?.url ?? null, courseUrl);
  // A retry of a saved course keeps the tab the learner started from.
  const selectedTabId =
    !courseUrl && current.phase === "permission-lost" && current.latestInCourseTabId != null
      ? current.latestInCourseTabId
      : selectedTab?.id;
  if (!selectedCourseUrl || selectedTabId === undefined) {
    return {
      code: "invalid-course-url",
      message: "Open your online course before starting the guard.",
      ok: false,
    };
  }
  const next = reduceGuard(createGuardState(), {
    atMs: Date.now(),
    courseUrl: selectedCourseUrl,
    tabId: selectedTabId,
    type: "START",
  });
  if (next.phase === "idle") {
    return {
      code: "invalid-course-url",
      message: "Enter a valid HTTP(S) Course URL.",
      ok: false,
    };
  }
  if (!(await requestCourseOriginAccess(chrome.permissions, next.courseOrigin!))) {
    // Persist the chosen course as permission-lost so the popup offers
    // "Try again" (a valid gesture path for the Chrome origin prompt)
    // and the web app shows Permission needed — no dead-end idle loop.
    await saveState({ ...next, phase: "permission-lost" });
    return {
      code: "permission-needed",
      message:
        "Course access is needed to detect when you leave the course website. Open the extension popup and allow access there.",
      ok: false,
    };
  }
  await saveState(next);
  return { ok: true, state: next };
}

async function stopGuard(): Promise<ExtensionResponse> {
  const current = await loadState();
  const tab = await activeTab();
  const next = reduceGuard(current, { atMs: Date.now(), type: "STOP" });
  await removeCourseOriginAccess(chrome.permissions, current.courseOrigin);
  await saveState(next);
  await notifyTab(tab?.id, { type: "HIDE_INTERRUPTION" });
  return { ok: true, state: next };
}

async function focusCourseTab(tabId: number | undefined, url: string): Promise<void> {
  if (tabId !== undefined) {
    try {
      await chrome.tabs.update(tabId, { url });
      return;
    } catch {
      // The saved tab may have been closed since the guard started.
    }
  }
  try {
    await chrome.tabs.create({ url });
  } catch {
    // Tab creation is best-effort; the learner can reopen the course manually.
  }
}

async function returnToCourse(): Promise<ExtensionResponse> {
  const state = await loadState();
  if (!state.courseUrl) return { ok: false, message: "Start the guard from your course first." };
  const tab = await activeTab();
  const targetTabId = state.latestInCourseTabId ?? tab?.id;
  const targetUrl = state.latestInCourseUrl ?? state.courseUrl;
  await focusCourseTab(targetTabId, targetUrl);
  const next = reduceGuard(state, { type: "RETURN_TO_COURSE" });
  await saveState(next);
  return { ok: true, state: next };
}

async function handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  switch (message.type) {
    case "GET_STATE":
      return { ok: true, state: await loadState() };
    case "START_GUARD":
      return startGuard();
    case "STOP_GUARD":
      return stopGuard();
    case "RETURN_TO_COURSE":
      return returnToCourse();
  }
}

async function handleExternalMessage(
  message: unknown,
  senderUrl: string | undefined,
): Promise<CourseGuardBridgeResponse> {
  const validation = validateExternalBridgeMessage(senderUrl, message);
  if (!validation.ok) return createBridgeError(validation.code);

  switch (validation.request.type) {
    case "HELLO":
      return createHelloAck(await loadState());
    case "GET_STATE":
      return createStateResponse(await loadState());
    case "START_GUARD": {
      const result = await startGuard(validation.request.courseUrl);
      return result.ok
        ? createStateResponse(result.state)
        : createBridgeError(result.code ?? "invalid-course-url");
    }
    case "STOP_GUARD": {
      const result = await stopGuard();
      return result.ok ? createStateResponse(result.state) : createBridgeError("guard-not-active");
    }
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object" || !("type" in message)) return false;
  void handleMessage(message as ExtensionMessage).then(sendResponse);
  return true;
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  void handleExternalMessage(message, sender.url).then(sendResponse);
  return true;
});

chrome.runtime.onConnectExternal.addListener((port) => {
  if (port.name !== COURSE_GUARD_BRIDGE_NAME || !isApprovedWebAppOrigin(port.sender?.url)) {
    port.disconnect();
    return;
  }

  let handshaken = false;
  port.onDisconnect.addListener(() => externalPorts.delete(port));
  port.onMessage.addListener((message) => {
    const validation = validateExternalBridgeMessage(port.sender?.url, message);
    if (!validation.ok) {
      port.postMessage(createBridgeError(validation.code));
      return;
    }
    if (!handshaken && validation.request.type !== "HELLO") {
      port.postMessage(createBridgeError("invalid-protocol"));
      return;
    }
    if (validation.request.type === "HELLO") {
      handshaken = true;
      externalPorts.add(port);
    }
    void handleExternalMessage(message, port.sender?.url).then((response) => {
      port.postMessage(response);
    });
  });
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void chrome.tabs.get(tabId).then(syncActiveTab);
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.url) void syncActiveTab({ ...tab, url: changeInfo.url });
});

chrome.permissions.onRemoved.addListener(({ origins }) => {
  void (async () => {
    const state = await loadState();
    if (!state.courseOrigin || !origins.includes(courseOriginPattern(state.courseOrigin))) return;
    const next = reduceGuard(state, { atMs: Date.now(), type: "PERMISSION_REVOKED" });
    await saveState(next);
    const tab = await activeTab();
    await notifyTab(tab?.id, { type: "HIDE_INTERRUPTION" });
  })();
});
