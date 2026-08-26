import { expect, test } from "@playwright/test";

async function expectReadableMobilePlanter(page: import("@playwright/test").Page) {
  const planter = page.locator(".momo-sprout-planter");
  const art = planter.locator(".momo-sprout-planter-art");
  const copy = planter.locator(".momo-sprout-planter-copy");

  await expect(art).toBeVisible();
  await expect(copy).toBeVisible();
  await expect(copy.getByText("Garden keepsake")).toBeVisible();
  await expect(copy.getByText(/seeds$/)).toBeVisible();

  const [artBox, copyBox] = await Promise.all([art.boundingBox(), copy.boundingBox()]);
  expect(artBox).not.toBeNull();
  expect(copyBox).not.toBeNull();
  expect(copyBox!.width).toBeGreaterThanOrEqual(250);
  expect(copyBox!.y).toBeGreaterThanOrEqual(artBox!.y + artBox!.height + 12);
}

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
    // Ticket #26: the reward Focus Friend wears the companion's preset color style (default sky).
    await expect(page.locator(".session-reward-shell .focus-friend-body")).toHaveCSS(
      "background-color",
      "rgb(98, 201, 245)",
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

  test("keeps Archive garden panels inside the 390px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/archive");

    const planter = page.locator(".momo-sprout-planter");
    const seedCount = page.getByText("0 seeds", { exact: true });
    const collectedSprouts = page.locator(".momo-collected-sprouts");

    await expect(planter).toBeVisible();
    await expect(seedCount).toBeVisible();
    await expect(collectedSprouts).toBeVisible();

    const viewport = await page.locator("html").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    const boxes = await Promise.all(
      [planter, seedCount, collectedSprouts].map((element) =>
        element.evaluate((node) => {
          const box = node.getBoundingClientRect();
          return {
            clientWidth: node.clientWidth,
            scrollWidth: node.scrollWidth,
            width: box.width,
            x: box.x,
          };
        }),
      ),
    );

    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
    for (const box of boxes) {
      expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.clientWidth);
    }
  });

  test("keeps keyboard focus on Feed Momo without moving the control", async ({ page }) => {
    await page.goto("/#/plaza");

    const feedMomo = page.getByRole("button", { name: "Feed Momo" });
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await page.keyboard.press("Tab");
      if (await feedMomo.evaluate((button) => button === document.activeElement)) {
        break;
      }
    }

    await expect(feedMomo).toBeFocused();
    await expect(feedMomo).toHaveCSS("outline-style", "solid");
    await expect(feedMomo).toHaveCSS("outline-width", "3px");
    await expect(feedMomo).toHaveCSS("transform", "none");
  });

  test("keeps pointer hover feedback on Feed Momo", async ({ page }) => {
    await page.goto("/#/plaza");

    const feedMomo = page.getByRole("button", { name: "Feed Momo" });
    await feedMomo.hover();

    await expect(feedMomo).toHaveCSS("transform", "matrix(1, 0, 0, 1, -2, -2)");
  });

  test("shows Momo Town Hall controls without mobile overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/town-hall");

    await expect(page.getByRole("heading", { name: "Momo's Town Hall" })).toBeVisible();
    await expect(page.getByRole("img", { name: /Momo, encouraging/i })).toBeVisible();
    await expect(page.getByLabel("Next session length")).toBeVisible();
    await expect(page.getByRole("button", { name: "Export my data" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Keep your study world yours" })).toHaveCount(0);

    const viewport = await page.locator("html").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
  });

  test("keeps shared keepsake copy readable in Archive and Reward at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/archive");
    await expectReadableMobilePlanter(page);

    await page.goto("/");
    await page.getByLabel("Subject").fill("SQL");
    await page.getByLabel("Session goal").fill("Review joins");
    await page.getByRole("button", { name: "Start session" }).press("Enter");
    await page.getByRole("button", { name: "End session" }).click();
    await page.getByRole("button", { name: "Yes" }).click();
    await expect(page.getByRole("heading", { name: /Momo is proud/i })).toBeVisible();
    await expectReadableMobilePlanter(page);
  });

  test("keeps the Momo Town Hall back link visibly focused from the keyboard", async ({ page }) => {
    await page.goto("/#/town-hall");

    const backToPlazaLink = page.getByRole("link", { name: "← Back to Plaza" });
    await page.keyboard.press("Tab");

    await expect(backToPlazaLink).toBeFocused();
    await expect(backToPlazaLink).toHaveCSS("outline-style", "solid");
    await expect(backToPlazaLink).toHaveCSS("outline-width", "3px");
  });
});
