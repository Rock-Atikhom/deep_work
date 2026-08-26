import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGuardState, type GuardState } from "./guard-machine";

function renderPopupShell(): HTMLButtonElement {
  document.body.innerHTML = `
    <p id="status"></p>
    <div id="course"></div>
    <div id="progress"></div>
    <div class="companion"></div>
    <p id="message"></p>
    <button id="toggle" type="button"></button>
    <button id="open-plaza" type="button"></button>
  `;

  return document.querySelector<HTMLButtonElement>("#toggle")!;
}

function installChromeMock(initialState: GuardState) {
  const sendMessage = vi.fn(async (message: { type: string }) => {
    if (message.type === "GET_STATE") return { ok: true, state: initialState };
    if (message.type === "STOP_GUARD") return { ok: true, state: createGuardState() };
    if (message.type === "RETURN_TO_COURSE") {
      return { ok: true, state: { ...initialState, phase: "watching" } };
    }
    if (message.type === "START_GUARD") return { ok: true, state: initialState };
    throw new Error(`Unexpected message: ${message.type}`);
  });

  vi.stubGlobal("chrome", {
    permissions: {
      contains: vi.fn(async () => true),
      remove: vi.fn(async () => true),
      request: vi.fn(async () => true),
    },
    runtime: { sendMessage },
    tabs: {
      create: vi.fn(async () => undefined),
      query: vi.fn(async () => [{ id: 1, url: initialState.courseUrl }]),
    },
  });

  return sendMessage;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Course Guard popup actions", () => {
  it("sends STOP_GUARD when the active popup action is stop", async () => {
    const state = {
      ...createGuardState(),
      courseOrigin: "https://learn.example.com",
      courseUrl: "https://learn.example.com/lesson",
      phase: "watching" as const,
    };
    const sendMessage = installChromeMock(state);
    const toggle = renderPopupShell();

    await import("./popup");
    await waitFor(() => expect(toggle.dataset.action).toBe("stop"));
    fireEvent.click(toggle);

    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "STOP_GUARD" }));
  });

  it("sends RETURN_TO_COURSE when the active popup action is return", async () => {
    const state = {
      ...createGuardState(),
      courseOrigin: "https://learn.example.com",
      courseUrl: "https://learn.example.com/lesson",
      phase: "interruption" as const,
    };
    const sendMessage = installChromeMock(state);
    const toggle = renderPopupShell();

    await import("./popup");
    await waitFor(() => expect(toggle.dataset.action).toBe("return"));
    fireEvent.click(toggle);

    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "RETURN_TO_COURSE" }));
  });
});
