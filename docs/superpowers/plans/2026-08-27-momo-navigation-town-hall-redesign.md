# Momo Navigation and Town Hall Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Momo's four Plaza destinations one accessible back-link treatment, bring Town Hall into the Plaza visual system, and make Archive's empty garden state feel intentional without changing app behavior.

**Architecture:** Add a stateless `MomoBackLink` presentational component and render it from the four destination shells. Keep route selection and all existing callbacks in `App.tsx`; limit behavior changes to the new Archive guidance link. Replace the Town Hall-specific visual treatment with scoped Plaza-family CSS and add a compact empty-state block inside `MomoMemoryGarden`.

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library, Playwright, Vite, existing CSS custom properties.

## Global Constraints

- Preserve existing routes, hash destinations, extension handshake behavior, settings behavior, local IndexedDB data, and session behavior.
- Use a native anchor with `href="#/plaza"` and accessible name `← Back to Plaza` on Archive, Town Hall, Wardrobe, and Course Guard.
- Style the shared back control with a yellow surface, 3px navy border, offset navy shadow, minimum 46px height, one-line label, and a visible non-layout-moving focus ring.
- Use warm cream and sky Plaza surfaces; reserve pink for Momo decoration and limited secondary/error emphasis.
- Keep keyboard accessibility and 390px responsive layout without horizontal overflow.
- Do not change the router, add dependencies, add animations, or introduce another unrelated theme.
- Production code must follow TDD: each new behavior gets a failing test before its implementation.

---

## File map

- **Create:** `src/ui/components/MomoBackLink.tsx` — the single stateless back-link markup contract.
- **Create:** `src/ui/components/MomoBackLink.test.tsx` — direct component contract test.
- **Modify:** `src/app/App.tsx` — render `MomoBackLink` in the Archive route shell; keep route selection and callbacks unchanged.
- **Modify:** `src/ui/screens/MomoTownHallScreen.tsx` — render `MomoBackLink` in the existing Town Hall header.
- **Modify:** `src/ui/screens/WardrobeScreen.tsx` — render `MomoBackLink` in the existing Wardrobe header.
- **Modify:** `src/ui/screens/CourseGuardScreen.tsx` — render `MomoBackLink` in the existing Course Guard header.
- **Modify:** `src/ui/screens/MomoMemoryGarden.tsx` — add the guided no-sprouts state while leaving populated sprout lists unchanged.
- **Modify:** `src/ui/styles.css` — define shared back-link, Archive empty-state, and scoped Town Hall visual rules; remove conflicting parent-specific link rules.
- **Modify:** `src/ui/screens/MomoTownHallScreen.test.tsx` — assert Town Hall renders the shared link while retaining behavior tests.
- **Modify:** `src/ui/momo-memory-garden.test.tsx` — assert the new no-sprouts guidance and Plaza destination.
- **Modify:** `src/app/App.test.tsx` — update the Archive route contract to the shared accessible name and destination.
- **Modify:** `src/app/App.garden.test.tsx` — update the post-deletion empty-state assertion.
- **Modify:** `tests/e2e/momo-consistency.spec.ts` — cover the shared link across all four routes, Town Hall surface colors, Archive guidance, and mobile overflow.

## Documentation and verification references

- Design requirements: `docs/superpowers/specs/2026-08-27-momo-navigation-town-hall-redesign-design.md`
- Full route audit evidence: `/tmp/momo-route-audit-report.json` and `/tmp/momo-route-audit/`
- Existing Plaza styling and tokens: `src/ui/styles.css` and `src/ui/tokens.css`
- Existing route behavior and callbacks: `src/app/App.tsx`

---

### Task 1: Add and adopt the shared back-link component

**Files:**
- Create: `src/ui/components/MomoBackLink.tsx`
- Create: `src/ui/components/MomoBackLink.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/ui/screens/MomoTownHallScreen.tsx`
- Modify: `src/ui/screens/WardrobeScreen.tsx`
- Modify: `src/ui/screens/CourseGuardScreen.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/ui/screens/MomoTownHallScreen.test.tsx`

**Interfaces:**
- `MomoBackLink` exports a React component with no props and renders one anchor with `className="momo-back-link"`, `href="#/plaza"`, and text `← Back to Plaza`.
- All four route shells consume the same component; no route receives a callback or alternate destination.

- [ ] **Step 1: Write the failing component test**

Add `src/ui/components/MomoBackLink.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MomoBackLink } from "./MomoBackLink";

describe("MomoBackLink", () => {
  it("renders the shared accessible Plaza destination", () => {
    render(<MomoBackLink />);

    const link = screen.getByRole("link", { name: "← Back to Plaza" });
    expect(link).toHaveAttribute("href", "#/plaza");
    expect(link).toHaveClass("momo-back-link");
  });
});
```

Update the Archive assertion in `src/app/App.test.tsx` from `← Plaza` to `← Back to Plaza`; add the same link assertion to the existing Town Hall route test. Update the Town Hall screen test to assert the link name and `#/plaza` destination.

- [ ] **Step 2: Run the focused tests and verify the expected red failure**

Run:

```bash
npm test -- src/ui/components/MomoBackLink.test.tsx src/app/App.test.tsx src/ui/screens/MomoTownHallScreen.test.tsx
```

Expected: the new test fails because `MomoBackLink` does not exist, and the updated route assertions fail because the old route-specific links still render.

- [ ] **Step 3: Implement the minimal component and route adoption**

Create `src/ui/components/MomoBackLink.tsx`:

```tsx
export function MomoBackLink() {
  return (
    <a className="momo-back-link" href="#/plaza">
      ← Back to Plaza
    </a>
  );
}
```

Import and render `<MomoBackLink />` in:

- `MomoTownHallScreen.tsx`, replacing its direct anchor.
- `WardrobeScreen.tsx`, replacing the `← Plaza` anchor.
- `CourseGuardScreen.tsx`, replacing the `← Plaza` anchor.
- `App.tsx` Archive route shell, replacing `.momo-memory-garden-route-back` markup.

Do not alter route state, event handlers, or any other destination links.

- [ ] **Step 4: Run the focused tests and verify green**

Run:

```bash
npm test -- src/ui/components/MomoBackLink.test.tsx src/app/App.test.tsx src/ui/screens/MomoTownHallScreen.test.tsx
```

Expected: all selected tests pass, including existing extension, personalization, deletion, and route behavior assertions.

- [ ] **Step 5: Commit the component adoption**

```bash
git add src/ui/components/MomoBackLink.tsx src/ui/components/MomoBackLink.test.tsx src/app/App.tsx src/app/App.test.tsx src/ui/screens/MomoTownHallScreen.tsx src/ui/screens/MomoTownHallScreen.test.tsx src/ui/screens/WardrobeScreen.tsx src/ui/screens/CourseGuardScreen.tsx
git commit -m "feat: unify Momo Plaza back navigation"
```

---

### Task 2: Replace Archive's blank empty state with first-sprout guidance

**Files:**
- Modify: `src/ui/screens/MomoMemoryGarden.tsx`
- Modify: `src/ui/momo-memory-garden.test.tsx`
- Modify: `src/app/App.garden.test.tsx`

**Interfaces:**
- Populated `snapshot.garden.plants` continues to render `.momo-collected-sprout-list` exactly as before.
- Empty `snapshot.garden.plants` renders a `.momo-empty-sprouts` block containing a heading, explanatory copy, and a real `#/plaza` link named `Start a focus session`.

- [ ] **Step 1: Write the failing empty-state test**

Add this test to `src/ui/momo-memory-garden.test.tsx` using the existing empty snapshot shape:

```tsx
it("guides a new gardener toward the first focus session", () => {
  render(
    <MomoMemoryGarden
      onClearHistory={() => undefined}
      onDelete={() => undefined}
      onExport={() => undefined}
      snapshot={{
        active: null,
        decks: [],
        garden: { plants: [], schemaVersion: 1, totalSeeds: 0 },
        plaza: createInitialPlazaState(),
        preferences: { durationMs: 25 * 60_000, selectedDeckId: null, sound: "silent" },
        schemaVersion: 1,
        summaries: [],
      }}
    />,
  );

  expect(screen.getByRole("heading", { name: "Your first sprout is waiting" })).toBeInTheDocument();
  expect(screen.getByText(/Complete a focus session and choose a reflection/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Start a focus session" })).toHaveAttribute(
    "href",
    "#/plaza",
  );
});
```

Change the existing empty-state assertion in `src/app/App.garden.test.tsx` from `No completed sessions yet.` to the new first-sprout heading or guidance copy.

- [ ] **Step 2: Run the focused tests and verify the expected red failure**

Run:

```bash
npm test -- src/ui/momo-memory-garden.test.tsx src/app/App.garden.test.tsx
```

Expected: the new test fails because the current empty state only renders `No completed sessions yet.` and has no Plaza link.

- [ ] **Step 3: Implement the empty-state markup**

In the empty branch of `MomoMemoryGarden.tsx`, replace the existing paragraph with:

```tsx
<div className="momo-empty-sprouts">
  <span className="momo-empty-sprouts-mark" aria-hidden="true">
    ✦
  </span>
  <h4>Your first sprout is waiting</h4>
  <p>Complete a focus session and choose a reflection to grow it here.</p>
  <a className="momo-empty-sprouts-link" href="#/plaza">
    Start a focus session
  </a>
</div>
```

Keep the section heading `Collected sprouts`, all populated-list markup, data buttons, and callbacks unchanged.

- [ ] **Step 4: Run the focused tests and verify green**

Run:

```bash
npm test -- src/ui/momo-memory-garden.test.tsx src/app/App.garden.test.tsx
```

Expected: both files pass; the populated garden test still confirms `.momo-empty-progress` is absent and all data callbacks still fire.

- [ ] **Step 5: Commit the Archive empty state**

```bash
git add src/ui/screens/MomoMemoryGarden.tsx src/ui/momo-memory-garden.test.tsx src/app/App.garden.test.tsx
git commit -m "feat: guide new gardeners to their first sprout"
```

---

### Task 3: Define failing route acceptance tests before styling

**Files:**
- Modify: `tests/e2e/momo-consistency.spec.ts`

**Interfaces:**
- The existing 16-route matrix remains the source of truth for route visibility, footer, errors, and 390px overflow.
- The new tests use the production route shells and check the same accessible back-link contract at both required viewports.
- The Town Hall visual test checks the semantic surface roles from the approved spec rather than implementation details.

- [ ] **Step 1: Write the failing E2E assertions**

Add a route list and tests to `tests/e2e/momo-consistency.spec.ts`:

```ts
const backLinkRoutes = [
  "/#/archive",
  "/#/town-hall",
  "/#/wardrobe",
  "/#/course-guard",
] as const;

test("uses one accessible Back to Plaza control on every Plaza destination", async ({ page }) => {
  for (const viewport of footerViewports) {
    await page.setViewportSize(viewport.size);
    for (const path of backLinkRoutes) {
      await page.goto(path);
      const link = page.getByRole("link", { name: "← Back to Plaza" });
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", "#/plaza");
      await expect(link).toHaveCSS("min-height", "46px");
      await expect(link).toHaveCSS("border-top-width", "3px");
      await link.focus();
      await expect(link).toBeFocused();
      await expect(link).toHaveCSS("outline-width", "3px");
    }
  }
});

test("keeps Town Hall in the Plaza visual language", async ({ page }) => {
  await page.goto("/#/town-hall");
  await expect(page.locator(".momo-town-hall-header")).toHaveCSS(
    "background-color",
    "rgb(157, 220, 255)",
  );
  await expect(page.locator(".momo-town-hall-hero")).toHaveCSS(
    "background-color",
    "rgb(255, 249, 234)",
  );
  await expect(page.locator(".momo-town-hall-preferences")).toHaveCSS(
    "background-color",
    "rgb(255, 217, 90)",
  );
  await expect(page.locator(".momo-town-hall-data")).toHaveCSS(
    "background-color",
    "rgb(121, 199, 121)",
  );
});

test("gives an empty Archive a first-sprout next step", async ({ page }) => {
  await page.goto("/#/archive");
  await expect(page.getByRole("heading", { name: "Your first sprout is waiting" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a focus session" })).toHaveAttribute(
    "href",
    "#/plaza",
  );
});
```

- [ ] **Step 2: Run the new E2E tests and verify the expected red failure**

Run:

```bash
npx playwright test -c tests/e2e/playwright.config.ts tests/e2e/momo-consistency.spec.ts --grep "Back to Plaza|Plaza visual language|empty Archive"
```

Expected: the new assertions fail against the current route-specific back-link CSS and Town Hall surfaces. The Archive content assertion may pass because Task 2 already added that markup; the command must still have failing tests before CSS implementation begins.

### Task 4: Apply the shared navigation and Plaza-family visual system

**Files:**
- Modify: `src/ui/styles.css`

**Interfaces:**
- `.momo-back-link` is the only shared back-link presentation contract.
- `.momo-town-hall` remains the existing DOM and callback surface; CSS changes only alter presentation.
- `.momo-empty-sprouts` is compact at desktop and remains readable when the Archive grid stacks at 390px.

- [ ] **Step 1: Add the shared back-link style and empty-state rules**

Add the shared rule near the existing Momo route consistency rules:

```css
.momo-back-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  width: fit-content;
  padding: 8px 13px;
  border: 3px solid var(--momo-ink);
  border-radius: 12px;
  background: var(--momo-lemon);
  box-shadow: 3px 3px 0 var(--momo-shadow);
  color: var(--momo-ink);
  font-weight: 900;
  text-decoration: none;
  white-space: nowrap;
}

.momo-back-link:hover {
  background: var(--momo-sky);
}

.momo-back-link:focus-visible {
  outline: 3px solid var(--momo-coral-focus);
  outline-offset: 4px;
}

.momo-memory-garden .momo-empty-sprouts {
  display: grid;
  justify-items: start;
  gap: 8px;
  align-content: start;
  min-height: 0;
  padding: 14px;
  border: 2px dashed rgb(36 50 74 / 40%);
  border-radius: 14px;
  background: #fffdf5;
}

.momo-memory-garden .momo-empty-sprouts-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 2px solid var(--momo-ink);
  border-radius: 50%;
  background: var(--momo-lemon);
  font-size: 1.05rem;
}

.momo-memory-garden .momo-empty-sprouts h4,
.momo-memory-garden .momo-empty-sprouts p {
  margin: 0;
}

.momo-memory-garden .momo-empty-sprouts h4 {
  font-size: 1.05rem;
}

.momo-memory-garden .momo-empty-sprouts p {
  max-width: 34rem;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.4;
}

.momo-memory-garden .momo-empty-sprouts-link {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  margin-top: 2px;
  padding: 7px 12px;
  border: 2px solid var(--momo-ink);
  border-radius: 10px;
  background: var(--momo-lemon);
  box-shadow: 2px 2px 0 var(--momo-shadow);
  color: var(--momo-ink);
  font-size: 0.88rem;
  font-weight: 900;
  text-decoration: none;
}
```

Use the existing `#fffdf5` panel color directly; no new color token is needed for this small empty state.

- [ ] **Step 2: Remove conflicting route-specific back-link rules**

Replace the existing `.momo-course-guard .plaza-inner-header a, .momo-wardrobe .plaza-inner-header a` block with the shared `.momo-back-link` contract or remove the duplicate declarations that would override it. Remove the old `.momo-town-hall .momo-town-hall-header a` styling and the old Archive route-back styling. The route-specific selectors must not redefine the shared link's label, color, border, radius, or shadow.

- [ ] **Step 3: Replace the Town Hall visual block with scoped Plaza-family rules**

Update the Town Hall section beginning at `/* Momo's Town Hall: a controlled home for focus and local data choices */` so that:

```css
.momo-town-hall {
  display: grid;
  gap: 18px;
  width: min(900px, calc(100% - 32px));
  min-height: 100dvh;
  margin: 0 auto;
  padding: 24px 0 48px;
  color: var(--momo-ink);
  font-family: "Arial Rounded MT Bold", "Trebuchet MS", "IBM Plex Sans", sans-serif;
}

.momo-town-hall .momo-town-hall-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px 16px;
  padding: 16px 18px;
  border: 4px solid var(--momo-ink);
  border-radius: 22px;
  background: var(--momo-sky);
  box-shadow: 6px 6px 0 var(--momo-shadow);
}

.momo-town-hall .momo-town-hall-header > p {
  margin: 0;
  color: var(--momo-ink);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.momo-town-hall .momo-town-hall-connection {
  justify-self: end;
  min-height: 30px;
  padding: 6px 10px;
  border: 2px solid var(--momo-ink);
  border-radius: 999px;
  background: var(--momo-leaf);
  box-shadow: 2px 2px 0 var(--momo-shadow);
  font-size: 0.8rem;
  font-weight: 900;
}

.momo-town-hall .momo-town-hall-connection-disconnected {
  background: var(--momo-pink);
}

.momo-town-hall .momo-town-hall-hero,
.momo-town-hall .momo-town-hall-card,
.momo-town-hall .momo-town-hall-status {
  border: 4px solid var(--momo-ink);
  border-radius: 22px;
  box-shadow: 6px 6px 0 var(--momo-shadow);
}

.momo-town-hall .momo-town-hall-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 20px;
  align-items: center;
  padding: 24px;
  background: var(--momo-cream);
}

.momo-town-hall .focus-friend {
  width: 142px;
  height: 142px;
}

.momo-town-hall .momo-town-hall-hero p,
.momo-town-hall .momo-town-hall-data p {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 700;
  line-height: 1.45;
}

.momo-town-hall .momo-town-hall-hero p:first-of-type {
  margin-bottom: 5px;
  color: var(--plaza-grass-dark);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.momo-town-hall h1,
.momo-town-hall h2 {
  margin: 0;
  color: var(--momo-ink);
  font-family: "Arial Rounded MT Bold", "Trebuchet MS", "IBM Plex Sans", sans-serif;
  font-weight: 900;
  letter-spacing: -0.05em;
}

.momo-town-hall h1 {
  margin-bottom: 8px;
  font-size: clamp(2.2rem, 7vw, 4.1rem);
  line-height: 0.94;
}

.momo-town-hall h2 {
  font-size: clamp(1.35rem, 4vw, 1.85rem);
  line-height: 1;
}

.momo-town-hall .momo-town-hall-status {
  margin: 0;
  padding: 12px 16px;
  background: var(--momo-lemon);
  font-weight: 900;
  line-height: 1.4;
}

.momo-town-hall .momo-town-hall-card {
  display: grid;
  gap: 14px;
  padding: 22px;
  background: var(--momo-cream);
}

.momo-town-hall .momo-town-hall-preferences {
  background: var(--momo-lemon);
}

.momo-town-hall .momo-town-hall-data {
  background: var(--momo-leaf);
}

.momo-town-hall .momo-town-hall-card label {
  display: grid;
  gap: 7px;
  font-weight: 900;
}

.momo-town-hall .momo-town-hall-card :is(input[type="text"], select) {
  width: 100%;
  min-height: 46px;
  border: 3px solid var(--momo-ink);
  border-radius: 12px;
  background: var(--momo-cream);
  color: var(--momo-ink);
  font: inherit;
  font-weight: 700;
}

.momo-town-hall .momo-town-hall-card :is(input[type="text"], select) {
  padding: 0 10px;
}

.momo-town-hall .momo-town-hall-card button {
  min-height: 46px;
  justify-self: start;
  border: 3px solid var(--momo-ink);
  border-radius: 12px;
  background: var(--momo-lemon);
  box-shadow: 3px 3px 0 var(--momo-shadow);
  color: var(--momo-ink);
  font: inherit;
  font-weight: 900;
  padding: 0 15px;
}

.momo-town-hall .momo-town-hall-connection-help > button,
.momo-town-hall .momo-town-hall-data button:last-child {
  background: var(--momo-pink);
}

.momo-town-hall .momo-town-hall-motion {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  width: fit-content;
}

.momo-town-hall .momo-town-hall-motion input {
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: var(--momo-ink);
}

.momo-town-hall .momo-town-hall-data > div {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.momo-town-hall a:focus-visible,
.momo-town-hall input:focus-visible,
.momo-town-hall select:focus-visible,
.momo-town-hall button:focus-visible {
  outline: 3px solid var(--momo-coral-focus);
  outline-offset: 4px;
}
```

Retain the existing color-style selectors and personalization layout rules. The connection copy, form fields, button labels, and handlers remain unchanged.

- [ ] **Step 4: Add responsive Town Hall rules without changing route behavior**

At `max-width: 620px`, stack the header and hero, make the connection badge left-aligned, keep cards at full width, and make card action buttons full width:

```css
@media (max-width: 620px) {
  .momo-town-hall {
    width: min(100% - 24px, 620px);
    padding: 14px 0 30px;
  }

  .momo-town-hall .momo-town-hall-header {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .momo-town-hall .momo-town-hall-connection {
    justify-self: start;
  }

  .momo-town-hall .momo-town-hall-hero {
    grid-template-columns: 1fr;
    justify-items: center;
    padding: 20px;
    text-align: center;
  }

  .momo-town-hall .momo-town-hall-card button,
  .momo-town-hall .momo-town-hall-data > div,
  .momo-town-hall .momo-town-hall-data button {
    width: 100%;
  }
}
```

Keep the back-link hover as an instantaneous color change; do not add transition or animation declarations.

- [ ] **Step 5: Run formatting and focused component tests**

Run:

```bash
npx prettier --write src/ui/components/MomoBackLink.tsx src/ui/components/MomoBackLink.test.tsx src/ui/screens/MomoTownHallScreen.tsx src/ui/screens/WardrobeScreen.tsx src/ui/screens/CourseGuardScreen.tsx src/ui/screens/MomoMemoryGarden.tsx src/app/App.tsx src/ui/styles.css src/ui/momo-memory-garden.test.tsx src/ui/screens/MomoTownHallScreen.test.tsx src/app/App.test.tsx src/app/App.garden.test.tsx
git diff --check
npm test -- src/ui/components/MomoBackLink.test.tsx src/ui/screens/MomoTownHallScreen.test.tsx src/ui/momo-memory-garden.test.tsx src/app/App.test.tsx src/app/App.garden.test.tsx
```

Expected: formatting succeeds, `git diff --check` is clean, and all focused tests pass.

- [ ] **Step 6: Commit the visual implementation**

```bash
git add src/ui/styles.css
git commit -m "style: align Town Hall and Archive with Momo Plaza"
```

---

### Task 5: Run route acceptance coverage after the visual implementation

**Files:**
- Modify: `tests/e2e/momo-consistency.spec.ts` only if the approved contract needs a test-only correction.

- [ ] **Step 1: Run the focused route acceptance tests and verify green**

Run:

```bash
npx playwright test -c tests/e2e/playwright.config.ts tests/e2e/momo-consistency.spec.ts --grep "Back to Plaza|Plaza visual language|empty Archive"
```

Expected: the shared back-link, Town Hall surface, and Archive first-sprout tests pass at the required viewports.

- [ ] **Step 2: Run the complete Momo consistency suite**

Run:

```bash
npx playwright test -c tests/e2e/playwright.config.ts tests/e2e/momo-consistency.spec.ts
```

Expected: all route, footer, active-session, accessibility, visual-contract, error, reduced-motion, and 390px overflow tests pass.

- [ ] **Step 3: Commit the acceptance coverage**

```bash
git add tests/e2e/momo-consistency.spec.ts
git commit -m "test: cover Momo destination consistency"
```

---

### Task 6: Run the complete verification suite and inspect screenshots

**Files:**
- No additional source files; update tests or CSS only if a verification failure identifies a real regression.

- [ ] **Step 1: Run static checks**

```bash
npm run format:check
npm run lint
npm run typecheck
npm run vision:manifest:check
```

Expected: all commands exit 0 with no formatting, lint, type, or manifest failures.

- [ ] **Step 2: Run all unit tests and production builds**

```bash
npm test
npm run build
npm run extension:build
```

Expected: all Vitest files pass, the web build succeeds, and the extension build succeeds.

- [ ] **Step 3: Run Chrome bridge verification**

```bash
npm run verify:chrome
```

Expected: the extension bundle and bridge smoke verification succeed without changing app route behavior.

- [ ] **Step 4: Run the full Playwright acceptance suite**

```bash
npx playwright test -c tests/e2e/playwright.config.ts tests/e2e
```

Expected: every route is visible at desktop and 390px, no console/page errors occur, the four back controls share one contract, Town Hall has the Plaza-family surfaces, Archive has its guided empty state, and active Focus → Reflection → Reward navigation remains intact.

- [ ] **Step 5: Inspect generated screenshots at both required widths**

Review the generated files under `test-results/acceptance/` and compare them with the existing audit screenshots in `/tmp/momo-route-audit/`. Confirm visually:

- Archive, Town Hall, Wardrobe, and Course Guard show the same yellow `← Back to Plaza` control.
- Town Hall no longer presents a full blue/pink admin theme; its hero is cream, header is restrained sky, preferences are yellow, and local data is green.
- Archive's empty collected-sprouts area is compact and gives a clear next step.
- No route or footer has a horizontal overflow at 390px.

- [ ] **Step 6: Review the final diff and status**

```bash
git diff c0cb394..HEAD --stat
git diff c0cb394..HEAD --check
git status --short --branch
```

Expected: only the planned component, route, CSS, tests, and plan/spec artifacts are changed in the isolated feature branch; root untracked files remain untouched.

- [ ] **Step 7: Commit any final test-only corrections and report evidence**

If a test-only correction is required after inspection, commit it with a focused message. Otherwise, do not create a no-op commit. Report the exact verification commands and observed pass counts before offering branch integration options.
