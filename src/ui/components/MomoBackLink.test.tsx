import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MomoBackLink } from "./MomoBackLink";

describe("MomoBackLink", () => {
  it("renders the shared accessible Plaza destination", () => {
    render(<MomoBackLink />);

    const link = screen.getByRole("link", { name: "← Back to Plaza" });
    expect(link).toHaveAttribute("href", "#/plaza");
    expect(link).toHaveClass("momo-back-link");
  });
});
