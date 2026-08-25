import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("Timer-Only Focus Session", () => {
  afterEach(() => {
    window.location.hash = "";
  });

  it("opens the Plaza archive as Momo's Memory Garden", () => {
    window.location.hash = "#/archive";
    render(<App />);

    expect(screen.getByRole("heading", { name: "Momo's Memory Garden" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Momo sprout planter/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Plaza" })).toHaveAttribute("href", "#/plaza");
    expect(screen.queryByRole("heading", { name: "Your learning shelf" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete my data" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps advanced study tools out of the first setup view", () => {
    render(<App />);

    expect(screen.queryByRole("heading", { name: "Deck Library" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Momo's Memory Garden" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "More study tools" }));

    expect(screen.getByRole("heading", { name: "Deck Library" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Momo's Memory Garden" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide study tools" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Hide study tools" }));
    expect(screen.queryByRole("heading", { name: "Deck Library" })).not.toBeInTheDocument();
  });

  it("opens with a clear setup for one subject and one goal", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Make room for focused learning" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
    expect(screen.getByLabelText("Session goal")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "25 minutes" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Start session" })).toBeDisabled();
    expect(screen.getByText("Timer-Only Session")).toBeInTheDocument();
  });

  it("starts the Focus Stage after the student states an intention", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "SQL" } });
    fireEvent.change(screen.getByLabelText("Session goal"), { target: { value: "Review joins" } });
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));

    expect(screen.getByRole("heading", { name: "Focus Stage" })).toBeInTheDocument();
    expect(screen.getByText("Review joins")).toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause session" })).toBeInTheDocument();
  });

  it("supports pause, resume, end, and reflection choices", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "SQL" } });
    fireEvent.change(screen.getByLabelText("Session goal"), { target: { value: "Review joins" } });
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause session" }));

    expect(screen.getByText("Session paused")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume session" }));
    fireEvent.click(screen.getByRole("button", { name: "End session" }));

    expect(screen.getByRole("heading", { name: "Reflect on this session" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Partly" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Not yet" })).toBeInTheDocument();
  });
});
