import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "../app/App";
import type { CameraSnapshot } from "../camera/session";
import type { VisionClient, VisionRuntimeSnapshot } from "../vision/vision-client";
import type { VisionObservation } from "../awareness/types";

const { playAwarenessChime } = vi.hoisted(() => ({
  playAwarenessChime: vi.fn(() => Promise.resolve({ played: true as const })),
}));
vi.mock("../alerts/sound", () => ({ playAwarenessChime }));

class FakeCamera {
  snapshot: CameraSnapshot = {
    diagnostics: [],
    generation: 0,
    permission: "unknown",
    state: "privacy-introduction",
  };
  private listeners = new Set<(snapshot: CameraSnapshot) => void>();
  readonly videoRef = { current: null } as never;
  subscribe(listener: (snapshot: CameraSnapshot) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  async start() {
    this.snapshot = {
      ...this.snapshot,
      generation: 1,
      permission: "granted",
      state: "ready",
      width: 640,
      height: 360,
    };
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
  async retry() {
    return this.start();
  }
  stop() {
    this.snapshot = { ...this.snapshot, state: "stopped" };
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}

class FakeVision implements VisionClient {
  snapshot: VisionRuntimeSnapshot = {
    generation: 0,
    phase: "idle",
    calibrationProgress: 0,
    lastObservation: null,
    errorCode: null,
  };
  private listeners = new Set<(snapshot: VisionRuntimeSnapshot) => void>();
  subscribe(listener: (snapshot: VisionRuntimeSnapshot) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  prepare() {
    this.snapshot = { ...this.snapshot, generation: 1, phase: "ready" };
    this.listeners.forEach((listener) => listener(this.snapshot));
    return Promise.resolve();
  }
  startCalibration() {
    this.snapshot = { ...this.snapshot, phase: "calibrating", calibrationProgress: 0 };
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
  submitFrame() {
    return false;
  }
  cancel() {}
  dispose() {}
  emitCalibrationReady() {
    this.snapshot = { ...this.snapshot, phase: "ready", calibrationProgress: 1 };
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
  emitObservation(observation: VisionObservation) {
    this.snapshot = { ...this.snapshot, phase: "ready", lastObservation: observation };
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}

describe("camera-free study journey", () => {
  it("lets a student decline camera awareness and begin a timed focus session", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Continue without camera" }));
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "SQL" } });
    fireEvent.change(screen.getByLabelText("Study goal"), { target: { value: "Practice joins" } });
    fireEvent.click(screen.getByRole("radio", { name: "25 minutes" }));
    fireEvent.click(screen.getByRole("button", { name: "Begin focus session" }));
    expect(screen.getByRole("timer")).toHaveTextContent("25:00");
    expect(screen.getByText("Camera awareness is off")).toBeInTheDocument();
  });

  it("keeps one balanced awareness event and offers a gentle reset", async () => {
    const camera = new FakeCamera();
    const vision = new FakeVision();
    const { container } = render(<App camera={camera} vision={vision} />);
    fireEvent.click(screen.getByRole("button", { name: "Use private camera awareness" }));
    fireEvent.click(screen.getByRole("button", { name: "Allow camera awareness" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Set a quiet baseline" })).toBeInTheDocument(),
    );
    const calibrationScreen = container.querySelector<HTMLElement>(
      ".momo-plaza-gate .calibration-screen",
    );
    expect(calibrationScreen).toBeInTheDocument();
    expect(
      within(calibrationScreen!).getByRole("heading", { name: "Set a quiet baseline" }),
    ).toBeVisible();
    expect(
      within(calibrationScreen!).getByRole("button", { name: "Continue without camera" }),
    ).toBeVisible();
    const footer = screen.getByRole("contentinfo", { name: "Momo Town footer" });
    expect(footer.tagName).toBe("FOOTER");
    expect(footer).not.toHaveAttribute("role", "contentinfo");
    expect(footer.closest("main")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Start calibration" }));
    vision.emitCalibrationReady();
    await waitFor(() => expect(screen.getByText(/Camera awareness is ready/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "SQL" } });
    fireEvent.change(screen.getByLabelText("Study goal"), { target: { value: "Practice joins" } });
    fireEvent.click(screen.getByRole("radio", { name: "Standard" }));
    fireEvent.click(screen.getByRole("button", { name: "Begin focus session" }));
    vision.emitObservation({
      capturedAtMs: 0,
      evidenceQuality: "reliable",
      faceCount: 1,
      gazeDownScore: 0.9,
      headAwayScore: 0.1,
    });
    vision.emitObservation({
      capturedAtMs: 5_000,
      evidenceQuality: "reliable",
      faceCount: 1,
      gazeDownScore: 0.9,
      headAwayScore: 0.1,
    });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Your attention may have shifted" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Awareness event 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue studying" })).toBeInTheDocument();
    vision.emitObservation({
      capturedAtMs: 6_000,
      evidenceQuality: "reliable",
      faceCount: 1,
      gazeDownScore: 0.9,
      headAwayScore: 0.1,
    });
    expect(playAwarenessChime).toHaveBeenCalledOnce();
  });
});
