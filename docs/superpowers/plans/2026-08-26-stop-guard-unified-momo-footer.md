# Stop Guard and Unified Momo Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the built Chrome popup stop an active Course Guard and render one consistent Momo Town footer on every web-app surface.

**Architecture:** Keep the extension background worker authoritative and close the source-to-bundle gap by making the real Chrome verifier build first and exercise the generated popup. Keep the existing route architecture, but turn `LegalFooter` into a context-independent Momo Town component and place exactly one instance inside every route root.

**Tech Stack:** React 19, TypeScript 6, vanilla CSS, Vitest, Testing Library, Vite, Manifest V3, Playwright 1.62.

## Global Constraints

- Preserve the existing Learning Plaza routes, local-first privacy model, and extension authority.
- Stop is immediate and has no confirmation dialog.
- Do not change guard rewards, session history, course-origin permission rules, or interruption behavior.
- Do not add dependencies or copy Tamagotchi artwork, names, characters, or exact layouts.
- The footer must have no animation, must be keyboard accessible, and must not overflow at 390px.
- Work test-first and keep the extension and footer changes independently reviewable.

---

## File map

- `package.json`: guarantees `verify:chrome` builds `dist-extension` before browser verification.
- `scripts/verify-chrome-bridge.mjs`: verifies the generated popup sends Stop Guard through the real background worker and persisted storage.
- `src/ui/screens/LegalScreen.tsx`: owns the shared semantic Momo Town footer.
- `src/ui/screens/PlazaHomeScreen.tsx`: adds the footer to Plaza.
- `src/ui/screens/CourseGuardScreen.tsx`: adds the footer to Course Guard.
- `src/ui/screens/WardrobeScreen.tsx`: adds the footer to Wardrobe.
- `src/ui/screens/MomoTownHallScreen.tsx`: replaces the duplicated legal row with the shared footer.
- `src/app/App.tsx`: adds the footer to Session Archive and retains it for setup, focus, reward, and legal states.
- `src/ui/styles.css`: replaces parent-specific legal-footer variants with one Momo Town footer contract.
- `src/ui/legal.test.tsx`: verifies footer semantics and destinations.
- `tests/e2e/momo-consistency.spec.ts`: verifies one consistent footer across the route matrix, active focus, and reward states.

---

### Task 1: Make the generated popup Stop Guard path verifiable

**Files:**
- Modify: `package.json`
- Modify: `scripts/verify-chrome-bridge.mjs`
- Generated locally: `dist-extension/` (ignored; never commit)

**Interfaces:**
- Consumes: `GuardState` storage contract under key `guardState`; generated `popup.html`; extension runtime messaging.
- Produces: `npm run verify:chrome -- --headed=false`, which always builds and proves a generated-popup stop transition.

- [ ] **Step 1: Establish the failing fresh-check behavior**

Run from a worktree with no `dist-extension/`:

```bash
HEADLESS=1 npm run verify:chrome -- --headed=false
```

Expected: FAIL because the current command launches Chrome without first creating `dist-extension/`. This is the stale/missing bundle contract the task changes.

- [ ] **Step 2: Make Chrome verification build first**

Change the package script to:

```json
"verify:chrome": "npm run extension:build && node scripts/verify-chrome-bridge.mjs"
```

Do not alter `extension:build`; it remains the single Vite build entry point.

- [ ] **Step 3: Add the generated-popup stop scenario**

After discovering `extensionId` in `scripts/verify-chrome-bridge.mjs`, open the real generated popup and seed a valid active state:

```js
const popup = await context.newPage();
await popup.goto(`chrome-extension://${extensionId}/popup.html`);
const startedAtMs = Date.now() - 60_000;
await popup.evaluate(
  async ({ startedAtMs }) => {
    await chrome.storage.local.set({
      guardState: {
        courseOrigin: "https://learn.example.com",
        courseUrl: "https://learn.example.com/lesson",
        interruptionCount: 0,
        latestInCourseTabId: 1,
        latestInCourseUrl: "https://learn.example.com/lesson",
        lastSession: null,
        phase: "watching",
        returnCount: 0,
        sessionId: `guard-${startedAtMs}`,
        sessionStartedAtMs: startedAtMs,
      },
    });
  },
  { startedAtMs },
);
await popup.reload();
await popup.getByRole("button", { name: "Stop guard" }).click();
await popup.getByRole("button", { name: "Start guard" }).waitFor();
```

Read `chrome.storage.local` from the popup and record PASS only when `phase === "idle"` and `lastSession.completionStatus === "completed"`. Save `00-popup-stopped.png` with the other acceptance evidence.

- [ ] **Step 4: Verify the built extension path**

Run:

```bash
HEADLESS=1 npm run verify:chrome -- --headed=false
```

Expected: PASS for generated popup stop, real bridge connection, Plaza Ready state, and honest no-extension recovery; no browser page errors.

- [ ] **Step 5: Commit the extension verification change**

```bash
git add package.json scripts/verify-chrome-bridge.mjs
git commit -m "test: verify built popup stops course guard"
```

---

### Task 2: Define the universal Momo Town footer contract

**Files:**
- Modify: `src/ui/legal.test.tsx`
- Modify: `src/ui/screens/LegalScreen.tsx`
- Modify: `src/ui/styles.css`

**Interfaces:**
- Consumes: existing hash routes `#/plaza`, `#/town-hall`, `#/privacy`, and `#/terms`.
- Produces: `LegalFooter(): JSX.Element` with root `.momo-town-footer`, labelled navigation, and no parent-dependent appearance.

- [ ] **Step 1: Write the failing semantic footer test**

Extend `src/ui/legal.test.tsx` with a direct component test:

```tsx
render(<LegalFooter />);
const footer = screen.getByRole("contentinfo", { name: "Momo Town footer" });
expect(within(footer).getByRole("link", { name: "Plaza" })).toHaveAttribute("href", "#/plaza");
expect(within(footer).getByRole("link", { name: "Town Hall" })).toHaveAttribute(
  "href",
  "#/town-hall",
);
expect(within(footer).getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
  "href",
  "#/privacy",
);
expect(within(footer).getByRole("link", { name: "Terms of Use" })).toHaveAttribute(
  "href",
  "#/terms",
);
```

Import `within` and `LegalFooter`. The production change this catches is removal or misrouting of a universal footer destination.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx vitest run src/ui/legal.test.tsx
```

Expected: FAIL because the current footer has no accessible name, Plaza destination, or Town Hall destination.

- [ ] **Step 3: Implement the shared semantic markup**

Keep the existing export name to minimize call-site churn. Use this structure in `LegalScreen.tsx`:

```tsx
export function LegalFooter() {
  return (
    <footer aria-label="Momo Town footer" className="momo-town-footer">
      <div className="momo-town-footer-brand">
        <span aria-hidden="true" className="momo-town-footer-mark"><span /></span>
        <p><strong>Momo&apos;s Learning Plaza</strong><span>Small steps stay on this device.</span></p>
      </div>
      <nav aria-label="Momo Town">
        <a href="#/plaza">Plaza</a>
        <a href="#/town-hall">Town Hall</a>
      </nav>
      <nav aria-label="Legal">
        <a href="#/privacy">Privacy Policy</a>
        <a href="#/terms">Terms of Use</a>
      </nav>
    </footer>
  );
}
```

- [ ] **Step 4: Replace variant CSS with one component contract**

Define `.momo-town-footer` independently of its parent. Use a responsive grid, `var(--momo-cream)`, `3px solid var(--momo-ink)`, `4px 4px 0 var(--momo-shadow)`, 13–18px radii, real link hit areas, and a custom CSS Momo mark rather than an emoji. Remove `.legal-footer` rules and parent-specific footer overrides so route wrappers cannot change its appearance.

At `max-width: 640px`, stack the brand and nav groups. At all widths, keep `width: min(1180px, calc(100% - 32px))`, visible `:focus-visible`, and no animation or transition.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
npx vitest run src/ui/legal.test.tsx
```

Expected: PASS with all four destinations scoped to one named footer.

- [ ] **Step 6: Commit the footer contract**

```bash
git add src/ui/legal.test.tsx src/ui/screens/LegalScreen.tsx src/ui/styles.css
git commit -m "feat: add shared Momo Town footer"
```

---

### Task 3: Place exactly one footer on every route and session state

**Files:**
- Modify: `tests/e2e/momo-consistency.spec.ts`
- Modify: `src/ui/screens/PlazaHomeScreen.tsx`
- Modify: `src/ui/screens/CourseGuardScreen.tsx`
- Modify: `src/ui/screens/WardrobeScreen.tsx`
- Modify: `src/ui/screens/MomoTownHallScreen.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `LegalFooter` from `src/ui/screens/LegalScreen.tsx`.
- Produces: one `.momo-town-footer` within every rendered route root and active session surface.

- [ ] **Step 1: Write the failing route-matrix test**

Add this test to `tests/e2e/momo-consistency.spec.ts` using the existing `mobileRoutes` list:

```ts
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
```

In the existing real focus-to-reward journey, assert one named footer after the focus stage appears and again after the reward screen appears.

- [ ] **Step 2: Run the new browser test and verify RED**

Run:

```bash
npx playwright test --config=tests/e2e momo-consistency.spec.ts -g "uses one Momo Town footer"
```

Expected: FAIL first on Plaza because the direct route currently has no shared footer.

- [ ] **Step 3: Add the footer to direct screen roots**

Import and render `<LegalFooter />` as the final child of:

- `PlazaHomeScreen`
- `CourseGuardScreen`
- `WardrobeScreen`
- `MomoTownHallScreen`

Remove Town Hall's standalone `momo-town-hall-legal` nav because the shared footer owns those links.

- [ ] **Step 4: Add the footer to Session Archive**

In the `route === "archive"` branch of `App.tsx`, render `<LegalFooter />` after the optional delete dialog and before the closing `<main>`. Do not add wrappers or change archive behavior.

- [ ] **Step 5: Verify one footer across all routes and active states**

Run:

```bash
npx playwright test --config=tests/e2e momo-consistency.spec.ts
```

Expected: PASS, including the 390px overflow check, direct-route footer matrix, focus stage, and reward stage.

- [ ] **Step 6: Commit route coverage**

```bash
git add tests/e2e/momo-consistency.spec.ts src/app/App.tsx src/ui/screens/PlazaHomeScreen.tsx src/ui/screens/CourseGuardScreen.tsx src/ui/screens/WardrobeScreen.tsx src/ui/screens/MomoTownHallScreen.tsx
git commit -m "fix: unify Momo footer across routes"
```

---

### Task 4: Full verification and visual recheck

**Files:**
- Inspect: all changed files
- Generated locally: `dist/`, `dist-extension/`, `test-results/` (ignored; never commit)

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: fresh evidence that source, generated extension, desktop routes, and 390px routes agree.

- [ ] **Step 1: Run static and unit verification**

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run extension:build
```

Expected: every command exits 0; Vitest reports zero failed files and tests.

- [ ] **Step 2: Run complete browser verification**

```bash
npx playwright test --config=tests/e2e
HEADLESS=1 npm run verify:chrome -- --headed=false
```

Expected: all Playwright tests pass; Chrome smoke reports generated popup stop, connected bridge, Plaza Ready, and honest disconnected recovery.

- [ ] **Step 3: Reinspect every page bottom at desktop and mobile**

Use the route matrix at 1280×800 and 390×844. For every route verify:

- exactly one `.momo-town-footer` is visible;
- its four destination links are visible and keyboard reachable;
- computed border width is `3px` and background is the same RGB value;
- `document.documentElement.scrollWidth <= clientWidth` at 390px;
- no page or console errors occur.

Save representative full-page screenshots for Plaza, Course Guard, Archive, Town Hall, Privacy, focus, and reward in `test-results/acceptance/`.

- [ ] **Step 4: Review the final diff and generated-file boundary**

```bash
git diff --check
git status --short
git log --oneline --decorate -5
```

Expected: no whitespace errors; only intended source, test, documentation, and package-script files are tracked; generated directories remain ignored.

Do not commit generated builds or screenshots. If verification reveals a defect, return to the task that owns that behavior, add or strengthen its failing regression test, implement the correction, rerun that task's complete verification, and amend its focused commit.
