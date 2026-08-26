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

const mobileRoutes = [
  "/#/welcome",
  "/#/plaza",
  "/#/course-guard",
  "/#/archive",
  "/#/wardrobe",
  "/#/town-hall",
  "/#/setup",
  "/#/calibration",
  "/#/focus",
  "/#/quick-review",
  "/#/reflection",
  "/#/history",
  "/#/decks",
  "/#/settings",
  "/#/privacy",
  "/#/terms",
] as const;

const footerRouteMatrix = mobileRoutes;

const acceptanceDir = "test-results/acceptance";
const footerViewports = [
  { label: "desktop", size: { height: 800, width: 1280 } },
  { label: "mobile", size: { height: 844, width: 390 } },
] as const;

const representativeScreenshots: Record<(typeof footerRouteMatrix)[number], string | null> = {
  "/#/welcome": null,
  "/#/plaza": "plaza",
  "/#/course-guard": "course-guard",
  "/#/archive": "archive",
  "/#/wardrobe": null,
  "/#/town-hall": "town-hall",
  "/#/setup": null,
  "/#/calibration": null,
  "/#/focus": null,
  "/#/quick-review": null,
  "/#/reflection": null,
  "/#/history": null,
  "/#/decks": null,
  "/#/settings": null,
  "/#/privacy": "privacy",
  "/#/terms": null,
};

async function expectFooterLinksKeyboardReachable(page: import("@playwright/test").Page) {
  const footer = page.locator(".momo-town-footer");
  const linkNames = ["Plaza", "Town Hall", "Privacy Policy", "Terms of Use"];
  const reached = new Set<string>();

  await page.evaluate(() => document.body.focus());
  for (let attempt = 0; attempt < 100 && reached.size < linkNames.length; attempt += 1) {
    await page.keyboard.press("Tab");
    const activeName = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLAnchorElement && active.closest(".momo-town-footer")
        ? (active.textContent?.trim() ?? null)
        : null;
    });
    if (activeName && linkNames.includes(activeName)) reached.add(activeName);
  }

  expect([...reached].sort()).toEqual([...linkNames].sort());
  for (const name of linkNames) {
    await expect(footer.getByRole("link", { name })).toBeVisible();
  }
}

const mobileRouteHeadings: Record<(typeof mobileRoutes)[number], string> = {
  "/#/welcome": "Make room for focused learning",
  "/#/plaza": "Momo's Plaza",
  "/#/course-guard": "Keep one course close",
  "/#/archive": "Momo's Memory Garden",
  "/#/wardrobe": "Make the town feel like yours",
  "/#/town-hall": "Momo's Town Hall",
  "/#/setup": "Make room for focused learning",
  "/#/calibration": "Make room for focused learning",
  "/#/focus": "Make room for focused learning",
  "/#/quick-review": "Make room for focused learning",
  "/#/reflection": "Make room for focused learning",
  "/#/history": "Make room for focused learning",
  "/#/decks": "Make room for focused learning",
  "/#/settings": "Make room for focused learning",
  "/#/privacy": "Privacy Policy",
  "/#/terms": "Terms of Use",
};

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

test("keeps the real focus to reward journey within Momo surfaces", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 1280 });
  await page.goto("/");
  await page.getByLabel("Subject").fill("SQL");
  await page.getByLabel("Session goal").fill("Review joins");
  await page.getByRole("button", { name: "Start session" }).press("Enter");
  await expect(page.locator(".momo-study-room .focus-stage")).toBeVisible();
  await expect(page.locator(".momo-study-room .focus-stage")).toHaveCSS("border-top-width", "4px");
  await expect(page.getByRole("contentinfo", { name: "Momo Town footer" })).toHaveCount(1);
  await page.screenshot({ fullPage: true, path: `${acceptanceDir}/focus-desktop.png` });
  await page.setViewportSize({ height: 844, width: 390 });
  await page.screenshot({ fullPage: true, path: `${acceptanceDir}/focus-mobile.png` });
  await page.getByRole("button", { name: "End session" }).click();
  await page.getByRole("button", { name: "Yes" }).click();
  await expect(page.locator(".momo-reward-route .session-reward-shell")).toBeVisible();
  await expect(page.getByRole("contentinfo", { name: "Momo Town footer" })).toHaveCount(1);
  await page.screenshot({ fullPage: true, path: `${acceptanceDir}/reward-mobile.png` });
  await page.setViewportSize({ height: 800, width: 1280 });
  await page.screenshot({ fullPage: true, path: `${acceptanceDir}/reward-desktop.png` });
});

test("uses one Momo Town footer on every route", async ({ page }) => {
  for (const path of mobileRoutes) {
    await page.goto(path);
    const footer = page.getByRole("contentinfo", { name: "Momo Town footer" });
    await expect(footer).toHaveCount(1);
    await expect(footer.getByRole("link", { name: "Plaza" })).toHaveAttribute("href", "#/plaza");
    await expect(footer.getByRole("link", { name: "Town Hall" })).toHaveAttribute(
      "href",
      "#/town-hall",
    );
  }
});

test("audits the shared footer and branded favicon across every route and viewport", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (entry) => {
    if (entry.type() === "error") consoleErrors.push(entry.text());
  });

  let footerBackground: string | null = null;
  for (const viewport of footerViewports) {
    await page.setViewportSize(viewport.size);
    for (const path of footerRouteMatrix) {
      await page.goto(path, { waitUntil: "networkidle" });
      const footer = page.locator(".momo-town-footer");

      await expect(footer).toHaveCount(1);
      await expect(footer).toBeVisible();
      await expect(footer).toHaveAttribute("aria-label", "Momo Town footer");
      await expect(footer).not.toHaveAttribute("role", "contentinfo");
      expect(await footer.evaluate((element) => element.tagName)).toBe("FOOTER");
      await expect(footer.locator("xpath=ancestor::main")).toHaveCount(0);
      await expect(footer).toHaveCSS("border-top-width", "3px");
      const background = await footer.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      expect(background).toBe(footerBackground ?? background);
      footerBackground ??= background;
      await expectFooterLinksKeyboardReachable(page);
      await expect(page.getByRole("link", { name: "Privacy Policy" })).toHaveCount(1);
      await expect(page.getByRole("link", { name: "Terms of Use" })).toHaveCount(1);

      if (viewport.label === "mobile") {
        const viewportWidth = await page.locator("html").evaluate((html) => ({
          clientWidth: html.clientWidth,
          scrollWidth: html.scrollWidth,
        }));
        expect(viewportWidth.scrollWidth).toBeLessThanOrEqual(viewportWidth.clientWidth);
      }

      const screenshotName = representativeScreenshots[path];
      if (screenshotName) {
        await page.screenshot({
          fullPage: true,
          path: `${acceptanceDir}/${screenshotName}-${viewport.label}.png`,
        });
      }
    }
  }

  await expect(page.locator('link[rel~="icon"]')).toHaveAttribute("href", "/momo-favicon.svg");
  const faviconResponse = await page.evaluate(async () => {
    const response = await fetch("/momo-favicon.svg");
    return { contentType: response.headers.get("content-type"), status: response.status };
  });
  expect(faviconResponse.status).toBe(200);
  expect(faviconResponse.contentType).toContain("image/svg+xml");
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("keeps every valid hash route visible at 390px with safe session fallbacks", async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });

  for (const path of mobileRoutes) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: mobileRouteHeadings[path] })).toBeVisible();

    const viewport = await page.locator("html").evaluate((html) => ({
      clientWidth: html.clientWidth,
      scrollWidth: html.scrollWidth,
    }));
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
  }
});

test("shows Momo artwork while browser reduced-motion disables FocusFriend animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.goto("/#/plaza");
  await expect(page.getByRole("img", { name: "Momo, ready" })).toBeVisible();
  await expect(page.locator(".focus-friend")).toHaveCSS("animation-name", "none");

  await page.goto("/#/archive");
  await expect(page.getByRole("img", { name: /Momo sprout planter/ })).toBeVisible();

  await page.goto("/#/town-hall");
  await expect(page.getByRole("img", { name: "Momo, encouraging you" })).toBeVisible();
  await expect(page.locator(".focus-friend")).toHaveCSS("animation-name", "none");
});

test("keeps shared Momo setup controls keyboard-safe while preserving pointer feedback", async ({
  page,
}) => {
  await page.goto("/");

  const continueWithoutCamera = page.getByRole("button", { name: "Continue without camera" });
  const restingBackground = await continueWithoutCamera.evaluate(
    (button) => getComputedStyle(button).backgroundColor,
  );

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.keyboard.press("Tab");
    if (await continueWithoutCamera.evaluate((button) => button === document.activeElement)) {
      break;
    }
  }

  await expect(continueWithoutCamera).toBeFocused();
  await expect(continueWithoutCamera).toHaveCSS("outline-width", "3px");
  await expect(continueWithoutCamera).toHaveCSS("transform", "none");
  await expect(continueWithoutCamera).toHaveCSS("transition-duration", "0s");
  await expect(continueWithoutCamera).toHaveCSS("animation-name", "none");
  await expect(continueWithoutCamera).toHaveCSS("background-color", restingBackground);

  await page.goto("/");
  await continueWithoutCamera.hover();

  await expect(continueWithoutCamera).toHaveCSS("transform", "matrix(1, 0, 0, 1, -2, -2)");
  await expect(continueWithoutCamera).toHaveCSS("transition-duration", "0.16s, 0.16s, 0.16s");
  await expect(continueWithoutCamera).toHaveCSS(
    "transition-timing-function",
    "cubic-bezier(0.22, 1, 0.36, 1), cubic-bezier(0.22, 1, 0.36, 1), cubic-bezier(0.22, 1, 0.36, 1)",
  );
});

test("personalizes the Focus Friend name and color style from Town Hall", async ({ page }) => {
  await page.goto("/#/town-hall");

  await page.getByLabel("Companion name").fill("Pip");
  await page.getByRole("radio", { name: "Blossom pink" }).check();

  await expect(page.getByRole("img", { name: /Pip, encouraging/i })).toBeVisible();
  await expect(
    page.locator(".momo-town-hall .focus-friend-color-blossom .focus-friend-body"),
  ).toHaveCSS("background-color", "rgb(255, 159, 196)");

  await page.goto("/#/plaza");
  await expect(
    page.locator(".plaza-shell .focus-friend-color-blossom .focus-friend-body"),
  ).toHaveCSS("background-color", "rgb(255, 159, 196)");
  await expect(page.getByRole("img", { name: /Pip/i })).toBeVisible();
});
