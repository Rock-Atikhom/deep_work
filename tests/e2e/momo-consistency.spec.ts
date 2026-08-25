import { expect, test } from "@playwright/test";

const directRoutes = [
  { heading: "Momo's Plaza", path: "/#/plaza" },
  { heading: "Keep one course close", path: "/#/course-guard" },
  { heading: "Make the town feel like yours", path: "/#/wardrobe" },
  { heading: "Momo's Memory Garden", path: "/#/archive" },
  { heading: "Momo's Town Hall", path: "/#/town-hall" },
  { heading: "Privacy Policy", path: "/#/privacy" },
  { heading: "Terms of Use", path: "/#/terms" },
] as const;

const legacyRoutes = [
  { heading: "Keep one course close", path: "/#/course-guard", surface: ".momo-course-guard" },
  { heading: "Make the town feel like yours", path: "/#/wardrobe", surface: ".momo-wardrobe" },
  { heading: "Privacy Policy", path: "/#/privacy", surface: ".momo-town-notice-shell" },
] as const;

test("keeps direct Momo destinations and Town Notices visibly framed", async ({ page }) => {
  for (const route of directRoutes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
  }

  for (const route of legacyRoutes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
    await expect(page.locator(route.surface)).toHaveCSS("border-top-width", "4px");
  }

  await page.goto("/#/privacy");
  await expect(page.getByText(/Momo Memory Garden records/)).toBeVisible();
  await expect(page.getByText(/Learning Garden records/)).toHaveCount(0);

  await page.goto("/#/wardrobe");
  await expect(page.getByText("Momo's current look")).toBeVisible();
  await expect(page.getByRole("button", { name: "Locked" }).first()).toBeDisabled();
});
