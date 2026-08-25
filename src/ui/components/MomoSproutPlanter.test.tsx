import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MomoSproutPlanter } from "./MomoSproutPlanter";

describe("MomoSproutPlanter", () => {
  it("emits the semantic planter class structure used by the garden archive styles", () => {
    const { container } = render(
      <MomoSproutPlanter
        garden={{
          plants: [],
          schemaVersion: 1,
          totalSeeds: 0,
        }}
      />,
    );

    const planter = container.querySelector(".momo-sprout-planter");
    expect(planter).not.toBeNull();
    expect(planter?.querySelector(".momo-sprout-planter-art")).not.toBeNull();
    expect(planter?.querySelector(".momo-sprout-planter-svg")).not.toBeNull();
    expect(planter?.querySelector(".momo-sprout-planter-copy")).not.toBeNull();
    expect(planter?.querySelector(".momo-sprout-planter-kicker")).not.toBeNull();
    expect(planter?.querySelector(".momo-sprout-planter-total")).not.toBeNull();
    expect(planter?.querySelectorAll(".momo-sprout-planter-detail")).toHaveLength(2);
  });

  it("describes original Momo garden progress without an emoji marker", () => {
    render(
      <MomoSproutPlanter
        garden={{
          plants: [
            {
              createdAtMs: 1_000,
              growth: 2,
              seeds: 2,
              sessionId: "session-1",
              stage: "leaf",
              subject: "SQL",
            },
          ],
          schemaVersion: 1,
          totalSeeds: 2,
        }}
      />,
    );

    expect(
      screen.getByRole("img", { name: /momo sprout planter.*2 permanent seeds/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 seeds")).toBeInTheDocument();
    expect(screen.getByText("1 session recorded")).toBeInTheDocument();
    expect(screen.getByText("Latest stage: leaf")).toBeInTheDocument();
  });
});
