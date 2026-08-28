import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const outputDir = "/tmp/learning-plaza-poster";
const baseUrl = process.env.POSTER_BASE_URL ?? "http://127.0.0.1:4174";

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 2245, height: 3179 },
    deviceScaleFactor: 1,
  });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/poster/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const poster = page.locator("main[data-page-size='A1 portrait']");
  if ((await poster.count()) !== 1) throw new Error("A1 poster root is missing");
  const requiredAssets = page.locator("img[data-poster-asset]");
  if ((await requiredAssets.count()) !== 5) throw new Error("Poster asset contract is incomplete");
  const naturalWidths = await requiredAssets.evaluateAll((images) =>
    images.map((image) => image.naturalWidth),
  );
  if (naturalWidths.some((width) => width <= 0)) {
    throw new Error(`Poster asset failed to load: ${naturalWidths.join(", ")}`);
  }
  const posterSize = await poster.evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: Number.parseFloat(style.width), minHeight: Number.parseFloat(style.minHeight) };
  });
  const expectedWidth = (594 / 25.4) * 96;
  const expectedHeight = (841 / 25.4) * 96;
  if (
    Math.abs(posterSize.width - expectedWidth) > 1 ||
    Math.abs(posterSize.minHeight - expectedHeight) > 1
  ) {
    throw new Error(`Unexpected poster dimensions: ${JSON.stringify(posterSize)}`);
  }
  if (pageErrors.length > 0) throw new Error(pageErrors.join("\n"));

  await page.screenshot({
    path: `${outputDir}/learning-plaza-poster.png`,
    fullPage: true,
  });
  await page.pdf({
    path: `${outputDir}/learning-plaza-poster.pdf`,
    width: "594mm",
    height: "841mm",
    printBackground: true,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  });
} finally {
  await browser.close();
}
