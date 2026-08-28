# Learning Plaza Project Poster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone A1 portrait HTML poster and reproducible PDF/PNG renderer that communicates the verified Deep Work Course Guard / Learning Plaza project using the approved academic showcase design.

**Architecture:** Keep the poster isolated under `public/poster/` so Vite serves it as a static artifact without changing the React application. Use semantic HTML, dedicated CSS, original inline SVG for the system diagram, and curated project screenshots as local assets. Use Playwright to verify the poster contract and render print-ready PDF/PNG files to `/tmp/learning-plaza-poster/`.

**Tech Stack:** Static HTML5, CSS3, inline SVG, existing Vite public-asset serving, Node.js ESM, Playwright, Chromium PDF export.

## Global Constraints

- Use the A1 portrait canvas: 594 mm × 841 mm.
- Preserve the approved two-column academic showcase hierarchy from `docs/superpowers/specs/2026-08-28-learning-plaza-poster-design.md`.
- Use only verified project facts from `CONTEXT.md`, `DESIGN.md`, and the referenced design/spec artifacts.
- Do not change application behavior, routes, APIs, extension integration, persistence, or privacy guarantees.
- Do not claim that the product measures attention, proves distraction, reads page contents, or has user-study results.
- Label test evidence as **Implementation validation** or **Engineering validation**, never **Experimental results**.
- Keep metadata as visible literal placeholders `[AUTHOR NAME] | [INSTITUTION / COMPANY] | [DEMO OR REPOSITORY URL]` until the user supplies replacements.
- Use original project visuals and do not copy logos, artwork, or exact layouts from `~/Downloads/500042_MANJU_Real_Poster.pdf`.
- Keep generated PDF/PNG output outside the repository under `/tmp/learning-plaza-poster/`.
- Preserve root untracked `.agents/`, `HANDOFF.md`, and `skills-lock.json`.

---

## File map

- **Create:** `public/poster/index.html` — semantic one-page poster document and approved copy.
- **Create:** `public/poster/poster.css` — A1 print dimensions, two-column layout, typography, colors, panels, responsive preview behavior, and print rules.
- **Create:** `public/poster/learning-plaza-flow.svg` — original learner-flow and secure-boundary diagram.
- **Create:** `public/poster/assets/plaza.png` — curated Plaza screenshot.
- **Create:** `public/poster/assets/course-guard.png` — curated Course Guard screenshot.
- **Create:** `public/poster/assets/archive.png` — curated Archive screenshot.
- **Create:** `public/poster/assets/town-hall.png` — curated Town Hall/privacy screenshot.
- **Create:** `public/poster/assets/extension.png` — curated extension/interruption screenshot.
- **Create:** `scripts/render-learning-plaza-poster.mjs` — deterministic Chromium PDF and PNG renderer.
- **Create:** `tests/e2e/learning-plaza-poster.spec.ts` — static poster contract and asset-loading tests.
- **Modify:** `package.json` — add the `poster:render` command only.

The existing app source remains unchanged.

---

### Task 1: Prepare the poster asset contract and regression test

**Files:**
- Create: `tests/e2e/learning-plaza-poster.spec.ts`
- Create: `public/poster/index.html`
- Create: `public/poster/poster.css`
- Create: `public/poster/assets/plaza.png`
- Create: `public/poster/assets/course-guard.png`
- Create: `public/poster/assets/archive.png`
- Create: `public/poster/assets/town-hall.png`
- Create: `public/poster/assets/extension.png`

**Interfaces:**
- The poster page is served at `/poster/` by the existing Vite preview server.
- The test consumes semantic headings, `data-section` attributes, local image paths, and `data-page-size="A1 portrait"` from the poster page.
- Later tasks must preserve the section names and asset paths established here.

- [ ] **Step 1: Add the failing poster contract test first.**

Create the test with the following assertions before the poster is implemented:

```ts
import { expect, test } from "@playwright/test";

test.describe("Learning Plaza project poster", () => {
  test("exposes the approved A1 content structure", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/poster/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => globalThis.document.fonts.ready);

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
    await page.goto("/poster/");
    await page.waitForLoadState("networkidle");

    const images = page.locator("img[data-poster-asset]");
    await expect(images).toHaveCount(5);
    for (let index = 0; index < 5; index += 1) {
      await expect(images.nth(index)).toHaveJSProperty("complete", true);
      const naturalWidth = await images.nth(index).evaluate((image) => (image as HTMLImageElement).naturalWidth);
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
```

- [ ] **Step 2: Run the focused test to verify it fails for the missing page.**

Run:

```bash
npx playwright test tests/e2e/learning-plaza-poster.spec.ts --config=tests/e2e/playwright.config.ts
```

Expected: FAIL because `/poster/` and its required semantic structure do not exist yet.

- [ ] **Step 3: Create the required screenshot asset set.**

Use the existing route-audit evidence as the source for the four web-app visuals, selecting clean desktop screenshots rather than the contact sheet:

```bash
mkdir -p public/poster/assets
cp /tmp/momo-route-audit/desktop-01-plaza.png public/poster/assets/plaza.png
cp /tmp/momo-route-audit/desktop-02-course-guard.png public/poster/assets/course-guard.png
cp /tmp/momo-route-audit/desktop-03-archive.png public/poster/assets/archive.png
cp /tmp/momo-route-audit/desktop-05-town-hall.png public/poster/assets/town-hall.png
```

Create the fifth visual from the real built extension popup. This uses only a mocked Chrome response to select a deterministic watching state; it does not alter extension source or fabricate the popup markup:

```bash
npm run extension:build
node --input-type=module <<'NODE'
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

await mkdir("public/poster/assets", { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 420, height: 520 }, deviceScaleFactor: 2 });
  await page.addInitScript(() => {
    globalThis.chrome = {
      runtime: {
        sendMessage: async () => ({
          ok: true,
          state: {
            phase: "watching",
            courseOrigin: "https://learn.example.com",
            courseUrl: "https://learn.example.com/lesson",
            interruptionCount: 1,
            latestInCourseTabId: 7,
            latestInCourseUrl: "https://learn.example.com/lesson",
            lastSession: null,
            returnCount: 2,
            sessionId: "poster-preview",
            sessionStartedAtMs: 0,
          },
        }),
      },
      tabs: { create: async () => undefined, query: async () => [] },
      permissions: { request: async () => true },
    };
  });
  await page.goto(pathToFileURL(resolve("dist-extension/popup.html")).href, { waitUntil: "networkidle" });
  await page.screenshot({ path: "public/poster/assets/extension.png" });
} finally {
  await browser.close();
}
NODE
```

The extension image must show the real compact popup with a meaningful state; do not use a generic browser mock or copy third-party artwork.

- [ ] **Step 4: Add the minimal page shell required by the test.**

Create `public/poster/index.html` with this shell and the final content sections added in Task 2. The shell is intentionally minimal so the contract test is red until the content is added:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Deep Work Course Guard — Project Poster</title>
    <link rel="stylesheet" href="./poster.css" />
  </head>
  <body>
    <main class="poster" data-page-size="A1 portrait">
      <p class="poster-loading-contract">Poster content is added in Task 2.</p>
    </main>
  </body>
</html>
```

- [ ] **Step 5: Run the focused test again to confirm the remaining assertions are red.**

Run the same Playwright command. Expected: the page title and shell pass, while the section, copy, and five-asset assertions fail because the content and assets are not complete.

- [ ] **Step 6: Commit the test and asset contract.**

```bash
git add tests/e2e/learning-plaza-poster.spec.ts public/poster/index.html public/poster/assets
git commit -m "test: define Learning Plaza poster contract"
```

---

### Task 2: Implement the approved poster content, diagram, and visual system

**Files:**
- Modify: `public/poster/index.html`
- Create: `public/poster/learning-plaza-flow.svg`
- Modify: `public/poster/poster.css`

**Interfaces:**
- `index.html` provides exactly one `main.poster` with the six tested `data-section` values and five `img[data-poster-asset]` elements.
- `learning-plaza-flow.svg` is an original, self-contained SVG with labelled learner flow and secure system boundary.
- `poster.css` owns all poster layout and print styling; no application stylesheet is imported.

- [ ] **Step 1: Write the semantic header and metadata block.**

In `public/poster/index.html`, add a header containing:

```html
<header class="poster-header">
  <p class="poster-kicker">Deep Work Companion · Learning Plaza</p>
  <h1>Deep Work Course Guard: A Local-First Learning Companion for Gentle Focus</h1>
  <p class="poster-subtitle">
    A privacy-first browser extension and companion dashboard that helps learners return to their online course without surveillance, punishment, or fixed Pomodoro intervals.
  </p>
  <p class="poster-meta">[AUTHOR NAME] | [INSTITUTION / COMPANY] | [DEMO OR REPOSITORY URL]</p>
</header>
```

Keep the title as one clear `h1`, and use the exact approved placeholder metadata until the user supplies real values.

- [ ] **Step 2: Add the two-column content sections with approved copy.**

Place the six sections inside one `<div class="poster-grid">` immediately after the header. Use one `section[data-section="..."]` for each of these six labels:

```html
<section class="poster-panel poster-objective" data-section="Objective">
  <h2>Objective</h2>
  <ul>
    <li>Unwanted tab switching can interrupt online learning.</li>
    <li>Many blockers feel restrictive or punitive.</li>
    <li>Course Guard provides a gentle, learner-directed boundary.</li>
    <li>The system detects leaving the course website without reading page content.</li>
    <li>Session summaries and companion progress remain local to the browser.</li>
  </ul>
</section>

<section class="poster-panel poster-methodology" data-section="Methodology">
  <h2>Methodology</h2>
  <img class="poster-flow" src="./learning-plaza-flow.svg" alt="Learner flow from selecting a course website to returning to the course and completing a session" />
  <p class="panel-note">The extension is authoritative for active guard state and checks website origin, not page contents.</p>
</section>

<section class="poster-panel poster-companion" data-section="Companion experience">
  <h2>Companion experience</h2>
  <p class="state-flow">Resting → Ready → Focusing → Encouraging → Proud</p>
  <div class="poster-screens">
    <figure><img data-poster-asset src="./assets/plaza.png" alt="Learning Plaza dashboard" /><figcaption>Learning Plaza</figcaption></figure>
    <figure><img data-poster-asset src="./assets/course-guard.png" alt="Course Guard station" /><figcaption>Course Guard station</figcaption></figure>
    <figure><img data-poster-asset src="./assets/archive.png" alt="Session Archive" /><figcaption>Session Archive</figcaption></figure>
  </div>
  <p>Mood, energy, growth, and cosmetic unlocks are expressive progress signals, not attention or performance scores.</p>
</section>

<section class="poster-panel poster-privacy" data-section="Privacy by design">
  <h2>Privacy by design</h2>
  <ul>
    <li>No page-content reading.</li>
    <li>No uploaded browsing history.</li>
    <li>No camera frames transmitted.</li>
    <li>Explicit permission at guard start.</li>
    <li>Safe handling of permission denial or revocation.</li>
    <li>Local session history and companion progress.</li>
    <li>No leaderboard, streak pressure, punishment, or attention score.</li>
  </ul>
  <figure class="privacy-screen"><img data-poster-asset src="./assets/town-hall.png" alt="Town Hall privacy and connection controls" /><figcaption>Town Hall keeps connection and local-data controls visible.</figcaption></figure>
</section>

<section class="poster-panel poster-validation" data-section="Implementation validation">
  <h2>Implementation validation</h2>
  <ul>
    <li>49 unit-test files and 219 unit tests passed.</li>
    <li>25 responsive Playwright tests passed.</li>
    <li>Desktop and mobile route audit completed.</li>
    <li>Extension bridge and disconnected-state checks passed.</li>
    <li>Production and extension builds passed.</li>
  </ul>
  <figure class="extension-screen"><img data-poster-asset src="./assets/extension.png" alt="Course Guard extension popup or return interruption" /><figcaption>Compact extension companion surface</figcaption></figure>
</section>

<section class="poster-panel poster-conclusion" data-section="Conclusion and future work">
  <h2>Conclusion and future work</h2>
  <p>Deep Work Course Guard turns distraction recovery into a supportive interaction rather than a punishment. Learning Plaza combines a clear browser boundary with a friendly companion experience while keeping control, privacy, and progress local to the learner.</p>
  <h3>Potential future work</h3>
  <p>Usability testing with online learners, accessibility testing with assistive technologies, cross-browser extension support, and evaluation of return-to-course behavior.</p>
</section>
```

The final implementation may adjust grouping for visual fit, but must preserve the tested section labels, approved facts, and five image asset markers. Close the grid with this footer:

```html
</div>
<footer class="poster-footer">
  <span>Deep Work Course Guard · Learning Plaza</span>
  <span>[DEMO OR REPOSITORY URL]</span>
</footer>
```

- [ ] **Step 3: Create the original architecture SVG.**

Create `public/poster/learning-plaza-flow.svg` with `viewBox="0 0 1200 900"`, a readable title, and these exact visible nodes:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-labelledby="flow-title flow-desc">
  <title id="flow-title">Course Guard learner and system flow</title>
  <desc id="flow-desc">The learner selects a course website, starts Course Guard, leaves the course origin, receives a supportive return interruption, returns to the course, and completes the session. The Learning Plaza web app connects through a secure allowlisted bridge to the authoritative Course Guard extension.</desc>
  <!-- Use rounded rectangles, arrows, and the approved Learning Plaza palette. -->
  <!-- Visible labels: Select Course Website, Start Course Guard, Leave course origin, Return interruption, Back to course, Session complete, Learning Plaza web app, Secure allowlisted bridge, Course Guard extension, Browser tab origin. -->
</svg>
```

Draw the learner loop as the primary horizontal path and the web-app/bridge/extension boundary as a secondary lower band. Use navy strokes, sky-blue and cream surfaces, yellow action nodes, coral interruption emphasis, and green completion emphasis. Do not use a copied logo or third-party artwork.

- [ ] **Step 4: Implement A1 print CSS and the reference-inspired grid.**

Add the following foundations to `public/poster/poster.css`:

```css
@page {
  size: 594mm 841mm;
  margin: 0;
}

:root {
  --poster-sky: #a9d8e8;
  --poster-grass: #68a86e;
  --poster-yellow: #ffd66b;
  --poster-coral: #ef8e72;
  --poster-plum: #755b82;
  --poster-cream: #fff7e9;
  --poster-ink: #243347;
  --poster-muted: #56657a;
}

* { box-sizing: border-box; }
html, body { margin: 0; min-width: 320px; background: #d9e6e9; }
body { color: var(--poster-ink); font-family: "IBM Plex Sans", Arial, sans-serif; }
.poster {
  width: 594mm;
  min-height: 841mm;
  padding: 16mm;
  background: var(--poster-cream);
}
.poster-header {
  padding: 14mm 16mm 11mm;
  color: white;
  background: linear-gradient(120deg, var(--poster-plum), #176694 58%, #287fba);
  border: 3px solid var(--poster-ink);
  border-radius: 8mm;
}
.poster h1, .poster h2, .poster h3 { font-family: Georgia, "Times New Roman", serif; }
.poster h1 { margin: 3mm 0; font-size: 25mm; line-height: .98; }
.poster-subtitle { max-width: 480mm; margin: 5mm 0 0; font-size: 7mm; line-height: 1.18; }
.poster-meta { margin: 8mm -16mm -11mm; padding: 4mm 16mm; color: var(--poster-ink); background: var(--poster-sky); font-weight: 800; }
```

Add these remaining layout, caption, accessibility, and print rules after the foundations:

```css
.poster-grid { display: grid; grid-template-columns: minmax(0, .84fr) minmax(0, 1.16fr); gap: 8mm; margin-top: 9mm; }
.poster-panel { padding: 8mm; border: 3px solid var(--poster-ink); border-radius: 6mm; background: white; break-inside: avoid; }
.poster-panel h2 { margin: -14mm 0 7mm; width: max-content; max-width: 100%; padding: 3mm 7mm; color: white; background: var(--poster-ink); border-radius: 3mm; font-size: 10mm; }
.poster-panel p, .poster-panel li { font-size: 5.1mm; line-height: 1.23; }
.poster-panel li + li { margin-top: 2mm; }
.poster-methodology { grid-column: 2; grid-row: 1 / span 2; border-color: var(--poster-plum); }
.poster-objective { grid-column: 1; grid-row: 1; }
.poster-companion { grid-column: 1; grid-row: 2; }
.poster-privacy { grid-column: 1; grid-row: 3; }
.poster-validation { grid-column: 2; grid-row: 3; }
.poster-conclusion { grid-column: 1 / -1; }
.poster-flow { display: block; width: 100%; height: auto; }
.poster-screens { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
.poster-screens figure, .privacy-screen, .extension-screen { margin: 0; }
.poster-screens img, .privacy-screen img, .extension-screen img { display: block; width: 100%; height: auto; border: 2px solid var(--poster-ink); border-radius: 3mm; }
.poster figcaption { margin-top: 2mm; color: var(--poster-muted); font-size: 3.8mm; font-weight: 800; }
.state-flow { padding: 4mm; color: var(--poster-ink); background: var(--poster-yellow); border-radius: 3mm; font-weight: 800; text-align: center; }
.poster-footer { display: flex; justify-content: space-between; gap: 8mm; margin-top: 8mm; padding: 6mm 8mm; border-top: 3px solid var(--poster-ink); font-size: 4.4mm; }
.poster a:focus-visible { outline: 3px solid var(--poster-coral); outline-offset: 3px; }
@media screen and (max-width: 900px) {
  body { overflow-x: auto; }
  .poster { width: 594mm; }
}
@media print {
  html, body { background: white; }
  .poster { margin: 0; }
  .poster-panel, .poster-header { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
```

At screen widths below 900px, show the poster at `width: min(100%, 594mm)` with horizontal overflow allowed so the A1 composition remains inspectable rather than reflowing into an unreadable mobile poster.

- [ ] **Step 5: Run the focused poster tests and fix only poster files until green.**

Run:

```bash
npm run build
npx playwright test tests/e2e/learning-plaza-poster.spec.ts --config=tests/e2e/playwright.config.ts
```

Expected: both poster tests pass, all local assets have non-zero dimensions, and no application source files are changed.

- [ ] **Step 6: Commit the poster implementation.**

```bash
git add public/poster
# The contract test was committed in Task 1; renderer and package.json are committed in Task 3.
git commit -m "feat: add Learning Plaza project poster draft"
```

---

### Task 3: Add deterministic PDF/PNG rendering

**Files:**
- Create: `scripts/render-learning-plaza-poster.mjs`
- Modify: `package.json`

**Interfaces:**
- `npm run poster:render` first builds the application, opens `/poster/` from the generated Vite preview, and writes `/tmp/learning-plaza-poster/learning-plaza-poster.pdf` and `/tmp/learning-plaza-poster/learning-plaza-poster.png`.
- The renderer must fail on missing poster content, page errors, failed image loads, or a non-A1 poster element.

- [ ] **Step 1: Add the renderer script.**

Create `scripts/render-learning-plaza-poster.mjs` with this structure:

```js
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
  await page.evaluate(() => globalThis.document.fonts.ready);

  const poster = page.locator("main[data-page-size='A1 portrait']");
  if ((await poster.count()) !== 1) throw new Error("A1 poster root is missing");
  const requiredAssets = page.locator("img[data-poster-asset]");
  if ((await requiredAssets.count()) !== 5) throw new Error("Poster asset contract is incomplete");
  const naturalWidths = await requiredAssets.evaluateAll((images) => images.map((image) => image.naturalWidth));
  if (naturalWidths.some((width) => width <= 0)) throw new Error(`Poster asset failed to load: ${naturalWidths.join(", ")}`);
  const posterSize = await poster.evaluate((element) => {
    const style = globalThis.getComputedStyle(element);
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

  await page.screenshot({ path: `${outputDir}/learning-plaza-poster.png`, fullPage: true });
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
```

- [ ] **Step 2: Add the package command.**

Add this script to `package.json` without changing existing commands:

```json
"poster:render": "npm run build && (npm run preview -- --host 127.0.0.1 --port 4174 > /tmp/learning-plaza-poster-preview.log 2>&1 & preview_pid=$!; trap 'kill $preview_pid' EXIT; POSTER_BASE_URL=http://127.0.0.1:4174 node scripts/render-learning-plaza-poster.mjs)"
```

- [ ] **Step 3: Render the draft.**

Run:

```bash
npm run poster:render
file /tmp/learning-plaza-poster/learning-plaza-poster.pdf /tmp/learning-plaza-poster/learning-plaza-poster.png
```

Expected: both files exist; the PDF is one page and the PNG shows the complete A1 poster. The output stays in `/tmp` and is not committed.

- [ ] **Step 4: Commit the renderer.**

```bash
git add scripts/render-learning-plaza-poster.mjs package.json
git commit -m "chore: add poster PDF renderer"
```

---

### Task 4: Run final visual and repository verification

**Files:**
- Modify: `public/poster/index.html` only if visual inspection finds a copy/layout defect.
- Modify: `public/poster/poster.css` only if visual inspection finds a layout/print defect.
- Output: `/tmp/learning-plaza-poster/learning-plaza-poster.pdf`
- Output: `/tmp/learning-plaza-poster/learning-plaza-poster.png`

- [ ] **Step 1: Inspect the rendered PNG at full-page and zoomed scale.**

Use the image reader on `/tmp/learning-plaza-poster/learning-plaza-poster.png` and verify:

- title and subtitle are readable;
- the two-column hierarchy is clear;
- methodology/architecture is the largest visual;
- all five screenshots have meaningful captions;
- privacy language is visible without implying surveillance;
- the validation section is labelled engineering evidence;
- no panel clips at the A1 page edges;
- placeholders are visible and grouped in the metadata/QR areas.

If a change is needed, edit only `public/poster/index.html` or `public/poster/poster.css`, rerun the focused poster test, and rerender.

- [ ] **Step 2: Verify the generated PDF dimensions and page count.**

Run this Python check when `pypdf` is available:

```bash
python3 - <<'PY'
from pypdf import PdfReader
p = PdfReader('/tmp/learning-plaza-poster/learning-plaza-poster.pdf')
assert len(p.pages) == 1
page = p.pages[0]
assert abs(float(page.mediabox.width) - 1683.75) < 1
assert abs(float(page.mediabox.height) - 2384.25) < 1
print('A1 portrait PDF verified')
PY
```

- [ ] **Step 3: Run the complete verification suite.**

```bash
npm test
npm run format:check
npm run lint
npm run typecheck
npm run vision:manifest:check
npm run build
npx playwright test tests/e2e/learning-plaza-poster.spec.ts --config=tests/e2e/playwright.config.ts
npm run poster:render
git diff --check
```

Expected: all commands pass; the only tracked changes are the poster artifact, renderer, test, and package script, with no changes under `src/`.

- [ ] **Step 4: Record the final deliverables.**

Report:

- source: `public/poster/index.html`, `public/poster/poster.css`, and `public/poster/learning-plaza-flow.svg`;
- draft PDF: `/tmp/learning-plaza-poster/learning-plaza-poster.pdf`;
- preview PNG: `/tmp/learning-plaza-poster/learning-plaza-poster.png`;
- missing user inputs still represented by `[AUTHOR NAME]`, `[INSTITUTION / COMPANY]`, and `[DEMO OR REPOSITORY URL]`.

Do not claim the poster is final until the user supplies the missing metadata and approves the rendered visual.
