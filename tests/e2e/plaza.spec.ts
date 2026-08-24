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
    await expect(page.getByText("Session complete", { exact: true })).toHaveCount(0);
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

    await page.getByRole("button", { name: "Back to Momo's Plaza" }).focus();
    await expect(page.locator(":focus")).toBeVisible();
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
