import { expect, test } from "@playwright/test";

test.describe("Momo's Plaza", () => {
  test("turns a reflected timer session into a Momo reward and returns to Plaza", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel("Subject").fill("SQL");
    await page.getByLabel("Session goal").fill("Review joins");
    await page.getByRole("button", { name: "Start session" }).press("Enter");
    await page.getByRole("button", { name: "End session" }).click();
    await page.getByRole("button", { name: "Yes" }).click();

    await expect(page.getByRole("heading", { name: /Momo is proud/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Momo's Memory Garden" })).toBeVisible();
    await expect(page.getByRole("img", { name: /Momo sprout planter/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Learning Garden", exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByRole("heading", { name: "Quest Log" })).toBeVisible();
    await expect(page.locator(".momo-memory-garden")).toHaveCSS("border-top-width", "4px");
    await expect(page.getByText("Session complete", { exact: true })).toHaveCount(0);
    await expect(page.locator(".session-reward-shell .momo-game-hud")).toHaveCSS(
      "border-top-width",
      "3px",
    );
    await expect(page.locator(".session-reward-shell .focus-friend-body")).toHaveCSS(
      "background-color",
      "rgb(255, 159, 196)",
    );
    await page.getByRole("button", { name: "Back to Momo's Plaza" }).click();
    await expect(page).toHaveURL(/#\/plaza$/);
    await expect(page.getByRole("heading", { name: "Momo's Plaza" })).toBeVisible();
  });

  test("keeps the Momo reward return path reachable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByLabel("Subject").fill("SQL");
    await page.getByLabel("Session goal").fill("Review joins");
    await page.getByRole("button", { name: "Start session" }).press("Enter");
    await page.getByRole("button", { name: "End session" }).click();
    await page.getByRole("button", { name: "Yes" }).click();

    const returnButton = page.getByRole("button", { name: "Back to Momo's Plaza" });
    await page.keyboard.press("Tab");
    await expect(returnButton).toBeFocused();
    await expect(returnButton).toHaveCSS("outline-style", "solid");
    await expect(returnButton).toHaveCSS("outline-width", "3px");

    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    const hudBox = await page.locator(".session-reward-shell .momo-game-hud").boundingBox();
    const rewardCardBox = await page.locator(".session-reward-card").boundingBox();

    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
    expect(hudBox).not.toBeNull();
    expect(hudBox!.x).toBeGreaterThanOrEqual(0);
    expect(hudBox!.x + hudBox!.width).toBeLessThanOrEqual(viewport.clientWidth);
    expect(rewardCardBox).not.toBeNull();
    expect(rewardCardBox!.width).toBeGreaterThanOrEqual(viewport.clientWidth - 32);
  });

  test("shows Momo's Memory Garden from More study tools and keeps archive controls reachable on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "More study tools" }).click();

    await expect(page.getByRole("heading", { name: "Momo's Memory Garden" })).toBeVisible();
    await expect(page.getByRole("img", { name: /Momo sprout planter/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Learning Garden", exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByRole("heading", { name: "Quest Log" })).toBeVisible();
    await expect(page.locator(".momo-memory-garden")).toHaveCSS("border-top-width", "4px");

    const exportButton = page.getByRole("button", { name: "Export my data" });
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await page.keyboard.press("Tab");
      if (await exportButton.evaluate((button) => button === document.activeElement)) {
        break;
      }
    }
    await expect(exportButton).toBeFocused();
    await expect(exportButton).toHaveCSS("outline-style", "solid");

    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
  });

  test("shows the game dashboard and routes Study into Course Guard", async ({ page }) => {
    await page.goto("/#/plaza");
    await expect(page.getByRole("heading", { name: "Momo's Plaza" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Feed Momo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Play with Momo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Let Momo rest" })).toBeVisible();
    await page.getByRole("button", { name: "Study with Momo" }).click();
    await expect(page.getByRole("heading", { name: /Keep one course close/i })).toBeVisible();
  });

  test("keeps care controls and the Plaza map reachable on a small viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/plaza");
    await page.getByRole("button", { name: "Feed Momo" }).focus();
    await expect(page.locator(":focus")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Momo's Plaza map" })).toBeVisible();
  });
});
