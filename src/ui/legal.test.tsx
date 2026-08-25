import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";
import { LegalScreen } from "./screens/LegalScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";

describe("legal pages", () => {
  it("makes Privacy Policy and Terms of Use available from welcome, settings, and the footer", () => {
    const { rerender } = render(<WelcomeScreen onCamera={() => {}} onTimerOnly={() => {}} />);

    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "#/privacy",
    );
    expect(screen.getByRole("link", { name: "Terms of Use" })).toHaveAttribute("href", "#/terms");

    rerender(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    expect(screen.getAllByRole("link", { name: "Privacy Policy" }).length).toBeGreaterThan(1);
    expect(screen.getAllByRole("link", { name: "Terms of Use" }).length).toBeGreaterThan(1);
  });

  it("states the local-processing, storage, permission, and deletion commitments in the privacy policy", () => {
    render(<LegalScreen document="privacy" />);

    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeInTheDocument();
    expect(screen.getByText(/camera frames are processed locally/i)).toBeInTheDocument();
    expect(
      screen.getByText(/session summaries, reflections, Momo Memory Garden records/i),
    ).toBeInTheDocument();
    expect(screen.queryAllByText(/Learning Garden records/i)).toHaveLength(0);
    expect(
      screen.getByText(/do not store camera frames, images, raw landmarks.*biometric identifiers/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/browser camera permission/i)).toBeInTheDocument();
    expect(
      screen.getByText(/verified local vision runtime in an offline cache/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/export.*delete/i)).toBeInTheDocument();
    expect(screen.getByText(/has no analytics, advertising, remote AI/i)).toBeInTheDocument();
    expect(screen.getByText(/visible browser window/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Effective date: August 19, 2026/i)).not.toHaveLength(0);
  });

  it("states the voluntary and educational limits in the terms", () => {
    render(<LegalScreen document="terms" />);

    expect(screen.getByRole("heading", { name: "Terms of Use" })).toBeInTheDocument();
    expect(screen.getByText(/Use of Deep Work Companion is voluntary/i)).toBeInTheDocument();
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
    expect(screen.getByText(/not a disciplinary or proctoring tool/i)).toBeInTheDocument();
    expect(screen.getByText(/false positives/i)).toBeInTheDocument();
    expect(screen.getByText(/covert surveillance/i)).toBeInTheDocument();
    expect(screen.getByText(/required notices before minors use the app/i)).toBeInTheDocument();
    expect(screen.getByText(/third-party notices/i)).toBeInTheDocument();
    expect(screen.getByText(/without warranties/i)).toBeInTheDocument();
  });
});
