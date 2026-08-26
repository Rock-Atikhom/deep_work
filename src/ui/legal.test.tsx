import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";
import { LegalFooter, LegalScreen } from "./screens/LegalScreen";

describe("legal pages", () => {
  it("provides every Momo Town destination from one named footer", () => {
    render(<LegalFooter />);

    const footer = screen.getByRole("contentinfo", { name: "Momo Town footer" });
    expect(within(footer).getByRole("link", { name: "Plaza" })).toHaveAttribute("href", "#/plaza");
    expect(within(footer).getByRole("link", { name: "Town Hall" })).toHaveAttribute(
      "href",
      "#/town-hall",
    );
    expect(within(footer).getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "#/privacy",
    );
    expect(within(footer).getByRole("link", { name: "Terms of Use" })).toHaveAttribute(
      "href",
      "#/terms",
    );
  });

  it("keeps legal destinations in the shared footer for welcome, setup, and settings", () => {
    render(<App />);

    expect(screen.getAllByRole("contentinfo", { name: "Momo Town footer" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Privacy Policy" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Terms of Use" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    expect(screen.getAllByRole("contentinfo", { name: "Momo Town footer" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Privacy Policy" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Terms of Use" })).toHaveLength(1);
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
