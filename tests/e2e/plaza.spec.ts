import { expect, test } from "@playwright/test";

test.describe("Learning Plaza", () => {
  test("learner can open the plaza, inspect the companion, and reach Course Guard", async ({
    page,
  }) => {
    await page.goto("/#/plaza");
    await expect(page.getByRole("heading", { name: "Learning Plaza" })).toBeVisible();
    await expect(page.getByRole("img", { name: /Momo, ready/i })).toBeVisible();
    await page.getByRole("link", { name: /Course Guard/i }).click();
    await expect(page.getByRole("heading", { name: /Keep one course close/i })).toBeVisible();
    await expect(page.getByLabel("Course URL")).toBeVisible();
    await expect(page.getByText("Extension disconnected")).toBeVisible();
  });

  test("keeps the plaza destinations keyboard reachable", async ({ page }) => {
    await page.goto("/#/plaza");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
    await page.goto("/#/wardrobe");
    await expect(
      page.getByRole("heading", { name: /Make the town feel like yours/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Locked" }).first()).toBeDisabled();
  });
});
