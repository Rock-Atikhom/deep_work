import { expect, test } from "@playwright/test";

const posterPath = process.env.GITHUB_ACTIONS === "true" ? "/deep_work/poster/" : "/poster/";

test.describe("Learning Plaza project poster", () => {
  test("exposes the approved A1 content structure", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(posterPath);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveTitle("Deep Work Course Guard — Project Poster");
    await expect(page.locator("main[data-page-size='A1 portrait']")).toHaveCount(1);
    await expect(
      page.getByRole("heading", {
        name: "Deep Work Course Guard: A Local-First Learning Companion for Gentle Focus",
        level: 1,
      }),
    ).toBeVisible();

    for (const section of [
      "Objective",
      "Methodology",
      "Companion experience",
      "Privacy by design",
      "Implementation validation",
      "Conclusion and future work",
    ]) {
      await expect(page.locator(`[data-section='${section}']`)).toHaveCount(1);
    }

    await expect(page.getByText("[AUTHOR NAME]", { exact: false })).toBeVisible();
    await expect(page.getByText("[DEMO OR REPOSITORY URL]", { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("loads every required project visual without unsupported claims", async ({ page }) => {
    await page.goto(posterPath);
    await page.waitForLoadState("networkidle");

    const images = page.locator("img[data-poster-asset]");
    await expect(images).toHaveCount(5);
    for (let index = 0; index < 5; index += 1) {
      await expect(images.nth(index)).toHaveJSProperty("complete", true);
      const naturalWidth = await images
        .nth(index)
        .evaluate((image) => (image as HTMLImageElement).naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }

    const copy = await page.locator("body").innerText();
    expect(copy).toContain("No page-content reading");
    expect(copy).toContain("attention score");
    expect(copy).not.toContain("Experimental results");
    expect(copy).not.toContain("proves distraction");
    expect(copy).not.toContain("measures attention");
  });
});
