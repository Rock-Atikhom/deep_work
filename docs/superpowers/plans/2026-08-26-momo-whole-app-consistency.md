# Momo Whole-App Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn every Deep Work Companion web surface into a consistent original Momo Plaza experience without changing study, privacy, extension, data, or reward behavior.

**Architecture:** Add explicit Momo surface classes at existing App and screen render boundaries, then style only inside those scopes with the existing Momo tokens and CSS art. `App.tsx` retains state, routing, persistence, and event ownership. Component and browser tests protect visual boundaries, the mobile Archive layout, reduced motion, and the real session journey.

**Tech Stack:** React 19, TypeScript 6, CSS, Vite 8, Vitest 4, React Testing Library, Playwright.

## Global Constraints

- Preserve the Momo game loop, persistence schema, reward thresholds, Course Guard bridge, export, deletion, and legal claims.
- Do not add dependencies, copied Tamagotchi assets, a second companion, background sound, or continuous non-Momo effects.
- Use the existing `--momo-sky`, `--momo-cream`, `--momo-ink`, `--momo-pink`, `--momo-lemon`, `--momo-leaf`, and `--momo-blue` tokens with down-right Momo shadows.
- The Momo idle is the only ambient animation. It uses `transform` only and stops for both `prefers-reduced-motion: reduce` and `html[data-reduced-motion="true"]`.
- Pointer hover may move a control for 120–180ms using `cubic-bezier(0.22, 1, 0.36, 1)`; keyboard focus uses an immediate 3px outline and no transform.
- At 390px every route must satisfy `scrollWidth <= clientWidth`; the Archive planter title, seed total, and collected-sprout panel remain fully visible.
- Recheck every direct route at 1440px and 390px, plus setup → focus → reflection → reward, before the implementation commit.

---

## File structure

- `src/app/App.tsx` — Momo surface classes at route and session-phase boundaries; existing events and state remain unchanged.
- `src/ui/screens/CourseGuardScreen.tsx` — direct Course Guard root gets a Momo station class.
- `src/ui/screens/WardrobeScreen.tsx` — Wardrobe root gets a Momo destination class.
- `src/ui/screens/LegalScreen.tsx` — Town Notice wrapper and one stale visual-reference correction only.
- `src/ui/styles.css` — one final `/* Whole-app Momo consistency */` CSS section for scoped styles, responsiveness, focus behavior, and reduced-motion support.
- `src/app/App.test.tsx` — surface-boundary and session-phase coverage.
- `tests/e2e/plaza.spec.ts` and new `tests/e2e/momo-consistency.spec.ts` — visual route, mobile, motion, and real-journey coverage.

### Task 1: Add Momo surface boundaries without changing behavior

**Files:**
- Modify: `src/app/App.tsx:982-1688`
- Modify: `src/ui/screens/CourseGuardScreen.tsx:47-121`
- Modify: `src/ui/screens/WardrobeScreen.tsx:12-57`
- Modify: `src/ui/screens/LegalScreen.tsx:120-138`
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Consumes the existing routes, `SessionState`, `CourseGuardScreenProps`, `WardrobeScreenProps`, and `LegalDocument` unchanged.
- Produces the CSS hooks `momo-plaza-gate`, `momo-course-guard`, `momo-wardrobe`, `momo-town-notice-shell`, `momo-study-room`, and `momo-reward-route`.

- [ ] **Step 1: Write the failing surface-boundary tests**

Add to `src/app/App.test.tsx`:

```tsx
it("marks setup, direct destinations, legal notices, and focus as Momo surfaces", () => {
  const setup = render(<App />);
  expect(setup.container.querySelector(".momo-plaza-gate")).toBeInTheDocument();
  setup.unmount();

  window.location.hash = "#/course-guard";
  const guard = render(<App />);
  expect(guard.container.querySelector(".momo-course-guard")).toBeInTheDocument();
  guard.unmount();

  window.location.hash = "#/privacy";
  const notice = render(<App />);
  expect(notice.container.querySelector(".momo-town-notice-shell")).toBeInTheDocument();
});

it("keeps an active session inside the Momo study room", () => {
  const { container } = render(<App />);
  fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "SQL" } });
  fireEvent.change(screen.getByLabelText("Session goal"), { target: { value: "Review joins" } });
  fireEvent.click(screen.getByRole("button", { name: "Start session" }));
  expect(container.querySelector(".momo-study-room")).toBeInTheDocument();
});
```

Extend the legal test to expect `Momo Memory Garden records` and a zero count for `Learning Garden records`.

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- src/app/App.test.tsx --reporter=dot`

Expected: FAIL because the hooks and corrected legal reference do not exist.

- [ ] **Step 3: Add semantic boundary hooks and the safe product-name correction**

Keep all children, handlers, and ARIA attributes. Make these structural changes:

```tsx
// setup branch
<main className="page-shell momo-plaza-gate">…</main>

// focus, gentle-reset, quick-review, and reflection branches
<main className="page-shell momo-study-room">…</main>

// legal route branch
<main className="momo-town-notice-shell"><LegalScreen document={route} /></main>

// reward return fragment
<div className="momo-reward-route">…existing reward, garden, dialog, footer…</div>

// direct screen roots
<main className="plaza-inner-screen momo-course-guard" …>
<main className="plaza-inner-screen momo-wardrobe" …>
```

In `LegalScreen.tsx`, change only `Learning Garden records` to `Momo Memory Garden records`.

- [ ] **Step 4: Run focused behavior tests**

Run: `npm test -- src/app/App.test.tsx src/app/App.course-guard.test.tsx src/ui/legal.test.tsx --reporter=dot`

Expected: PASS; routing, legal links, Course Guard controls, and focus start remain intact.

- [ ] **Step 5: Commit**

```bash
git add src/app/App.tsx src/app/App.test.tsx src/ui/screens/CourseGuardScreen.tsx src/ui/screens/WardrobeScreen.tsx src/ui/screens/LegalScreen.tsx
git commit -m "feat: mark Momo app surfaces"
```

### Task 2: Style arrival, setup, destinations, tools, and Town Notices

**Files:**
- Modify: `src/ui/styles.css:after existing Momo Town Hall rules`
- Create: `tests/e2e/momo-consistency.spec.ts`

**Interfaces:**
- Consumes only Task 1 hooks and existing Momo tokens.
- Produces scoped Momo appearance without React prop, state, or route changes.

- [ ] **Step 1: Write the failing direct-route browser test**

Create `tests/e2e/momo-consistency.spec.ts` with direct-route headings for `/#/plaza`, `/#/course-guard`, `/#/wardrobe`, `/#/archive`, `/#/town-hall`, `/#/privacy`, and `/#/terms`. Require the three legacy roots to have a new 4px Momo outline:

```ts
for (const route of legacyRoutes) {
  await page.goto(route.path);
  await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
  await expect(page.locator(route.surface)).toHaveCSS("border-top-width", "4px");
}
```

For Privacy, expect `Momo Memory Garden records` and zero `Learning Garden records`. For Wardrobe, expect the Momo preview and a disabled locked cosmetic button.

- [ ] **Step 2: Run the browser test and verify it fails**

Run: `npx playwright test --config=tests/e2e --reporter=line momo-consistency.spec.ts`

Expected: FAIL because Course Guard, Wardrobe, and the Town Notice wrapper have no 4px Momo outline yet.

- [ ] **Step 3: Append the scoped Momo visual foundation**

Append `/* Whole-app Momo consistency */` to `src/ui/styles.css`. Start the new scopes with:

```css
:is(.momo-plaza-gate, .momo-course-guard, .momo-wardrobe, .momo-town-notice-shell, .momo-study-room, .momo-reward-route) {
  color: var(--momo-ink);
  font-family: "Arial Rounded MT Bold", "Trebuchet MS", "IBM Plex Sans", sans-serif;
}

:is(.momo-plaza-gate, .momo-course-guard, .momo-wardrobe, .momo-study-room, .momo-reward-route) {
  background: linear-gradient(180deg, var(--momo-sky) 0 28%, var(--momo-cream) 28% 100%);
}
```

Within the hooks, restyle setup cards, Course Guard, Wardrobe, Settings, Deck Library, History, deletion dialog, legal footer, and Town Notice with the established 4px Momo outline/shadow hierarchy. Keep Town Notice paragraphs in a 68ch readable column and preserve every disabled/status state.

- [ ] **Step 4: Run direct-route coverage**

Run: `npx playwright test --config=tests/e2e --reporter=line momo-consistency.spec.ts`

Expected: PASS with visible Momo surfaces, unchanged legal claims, and working locked Wardrobe controls.

- [ ] **Step 5: Commit**

```bash
git add src/ui/styles.css tests/e2e/momo-consistency.spec.ts
git commit -m "feat: unify Momo destination surfaces"
```

### Task 3: Repair mobile Archive and keyboard-safe interaction motion

**Files:**
- Modify: `src/ui/styles.css:existing Memory Garden responsive rules and Momo control rules`
- Test: `tests/e2e/plaza.spec.ts`

**Interfaces:**
- Consumes existing `.momo-memory-garden-grid`, `.momo-sprout-planter`, `.momo-collected-sprouts`, and all existing control labels unchanged.
- Produces a one-column 390px Archive layout and pointer-only transform feedback.

- [ ] **Step 1: Write failing Archive and focus-motion browser tests**

In `tests/e2e/plaza.spec.ts`, visit `/#/archive` at 390px. Assert the planter, `0 seeds`, and collected card all fit inside the viewport and `scrollWidth <= clientWidth`. Add a keyboard test for `Feed Momo`: focused control has a 3px outline and `transform: none`; retain a separate pointer-hover test that allows movement.

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx playwright test --config=tests/e2e --reporter=line plaza.spec.ts`

Expected: the Archive geometry assertion fails from narrow two-column content and the keyboard transform assertion fails from grouped hover/focus selectors.

- [ ] **Step 3: Correct layout and motion**

At the existing mobile breakpoint, use:

```css
@media (max-width: 620px) {
  .momo-memory-garden .momo-memory-garden-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

Set the planter copy regions to `min-width: 0` and allow wrapping. Split every grouped `:hover, :focus-visible` Momo selector: pointer hover alone can use `transform` and `box-shadow`; `:focus-visible` receives outline-only focus. Use `transform 160ms cubic-bezier(0.22, 1, 0.36, 1)` and matching shadow transition only for pointer feedback. Ensure existing system and app reduced-motion fallbacks disable every new transition.

- [ ] **Step 4: Re-run mobile and motion coverage**

Run: `npx playwright test --config=tests/e2e --reporter=line plaza.spec.ts`

Expected: PASS; no Archive clipping, keyboard focus does not move, pointer feedback stays tactile, and reduced motion stays functional.

- [ ] **Step 5: Commit**

```bash
git add src/ui/styles.css tests/e2e/plaza.spec.ts
git commit -m "fix: polish Momo mobile and focus motion"
```

### Task 4: Finish the active-study and recovery journey

**Files:**
- Modify: `src/ui/styles.css:Whole-app Momo consistency section`
- Test: `src/app/App.test.tsx`
- Test: `src/ui/session-journey.test.tsx`
- Test: `tests/e2e/momo-consistency.spec.ts`

**Interfaces:**
- Consumes `.momo-study-room` and `.momo-reward-route` plus existing `PAUSE`, `RESUME`, `END`, reflection, and `COMPLETE_REVIEW` session events.
- Produces a Momo study room for focus, calibration, gentle reset, quick review, reflection, and the attached reward/garden sequence.

- [ ] **Step 1: Write failing real-journey tests**

Extend the existing App journey test:

```tsx
expect(container.querySelector(".momo-study-room .focus-stage")).toBeInTheDocument();
fireEvent.click(screen.getByRole("button", { name: "End session" }));
expect(container.querySelector(".momo-study-room .reflection-card")).toBeInTheDocument();
```

In `src/ui/session-journey.test.tsx`, assert camera calibration is inside `.momo-plaza-gate` while `Set a quiet baseline` and `Continue without camera` remain visible.

Append this browser sequence:

```ts
await page.goto("/");
await page.getByLabel("Subject").fill("SQL");
await page.getByLabel("Session goal").fill("Review joins");
await page.getByRole("button", { name: "Start session" }).press("Enter");
await expect(page.locator(".momo-study-room .focus-stage")).toBeVisible();
await expect(page.locator(".momo-study-room .focus-stage")).toHaveCSS("border-top-width", "4px");
await page.getByRole("button", { name: "End session" }).click();
await page.getByRole("button", { name: "Yes" }).click();
await expect(page.locator(".momo-reward-route .session-reward-shell")).toBeVisible();
```

- [ ] **Step 2: Run journey tests and verify they fail**

Run: `npm test -- src/app/App.test.tsx src/ui/session-journey.test.tsx --reporter=dot`

Run: `npx playwright test --config=tests/e2e --reporter=line momo-consistency.spec.ts`

Expected: the unit boundary assertions are green after Task 1; the browser assertion is red until the focus stage has its Momo panel outline.

- [ ] **Step 3: Style the Momo study room and recovery screens**

Inside `.momo-study-room`, style `.focus-stage`, `.calibration-screen`, `.quick-review-screen`, `.reflection-card`, `.gentle-reset-dialog`, timer, and action rows as cream Momo panels over a sky-to-cream field. Timer text keeps tabular figures and remains the strongest visual signal. Use pink for reset/destructive actions, lemon for review cards, leaf for safe progress, and blue for camera/Course Guard context. Do not animate timer text, pause/resume, calibration progress, reflection buttons, or keyboard commands.

Style `.momo-reward-route` so the existing reward card, attached Memory Garden, and legal footer share the same Momo background and spacing rather than returning to the editorial body surface.

- [ ] **Step 4: Re-run journey coverage**

Run: `npm test -- src/app/App.test.tsx src/ui/session-journey.test.tsx src/ui/session-reward.test.tsx --reporter=dot`

Run: `npx playwright test --config=tests/e2e --reporter=line momo-consistency.spec.ts`

Expected: PASS; timer-only and camera-aware journeys preserve behavior and reflection reaches Momo reward.

- [ ] **Step 5: Commit**

```bash
git add src/ui/styles.css src/app/App.test.tsx src/ui/session-journey.test.tsx tests/e2e/momo-consistency.spec.ts
git commit -m "feat: bring study journey into Momo Plaza"
```

### Task 5: Complete every-page, reduced-motion, and release verification

**Files:**
- Modify: `tests/e2e/momo-consistency.spec.ts`
- Modify: `src/ui/styles.css` only when a failing audit identifies a scoped visual defect.

**Interfaces:**
- Consumes Task 1–4 CSS hooks and existing headings; adds no state or API surface.

- [ ] **Step 1: Write failing every-page and reduced-motion checks**

At 390px, loop through:

```ts
const mobileRoutes = [
  "/#/plaza", "/#/course-guard", "/#/archive", "/#/wardrobe",
  "/#/town-hall", "/#/privacy", "/#/terms",
];
```

For each route, assert its main heading then measure:

```ts
const viewport = await page.locator("html").evaluate((html) => ({
  clientWidth: html.clientWidth,
  scrollWidth: html.scrollWidth,
}));
expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
```

Add a reduced-motion test using `page.emulateMedia({ reducedMotion: "reduce" })` for Plaza, Archive, and Town Hall. Each must show its Momo artwork and its `FocusFriend` must have `animation-name: none`.

- [ ] **Step 2: Run the audit and record any remaining defect**

Run: `npx playwright test --config=tests/e2e --reporter=line momo-consistency.spec.ts`

Expected: PASS after Tasks 1–4. A failure names the remaining route-specific overflow, focus, or reduced-motion defect that Step 3 must correct.

- [ ] **Step 3: Fix only audit-reported scoped defects**

Use the failing selector and make the smallest scoped CSS correction. Do not change route logic, component props, persistence, reward calculations, or extension behavior in this task. Re-run the one failed test after every edit.

- [ ] **Step 4: Run final evidence**

```bash
npm run format:check
npm run lint
npm run typecheck
npm test -- --reporter=dot
npm run build
npm run extension:build
npm run vision:manifest:check
npx playwright test --config=tests/e2e --reporter=line
git diff --check
git status --short
```

Expected: every command exits 0; all route, mobile, reduced-motion, and real-journey checks pass; only intentional source, test, and documentation files are changed.

- [ ] **Step 5: Commit final audit coverage**

```bash
git add src/ui/styles.css tests/e2e/momo-consistency.spec.ts
git commit -m "test: verify Momo whole-app consistency"
```

## Plan self-review

- **Spec coverage:** Task 1 creates safe scopes; Task 2 converts entry, destinations, tools, and legal notices; Task 3 repairs Archive/mobile and interaction motion; Task 4 completes active-study and recovery; Task 5 checks all routes, reduced motion, and the real journey.
- **Placeholder scan:** All file paths, CSS hooks, commands, expected failures, and test assertions are explicit.
- **Type consistency:** Planned hooks are CSS classes only; existing component props and App session event interfaces remain unchanged.
