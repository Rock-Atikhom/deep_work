# Momo back-link width refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Archive route’s desktop `← Back to Plaza` control fit its label while retaining the existing mobile hit area and interaction treatment.

**Architecture:** Keep the shared `MomoBackLink` component and its base `inline-flex` sizing unchanged. Remove only the Archive desktop descendant rule that expands the link to the route container; keep the existing mobile media-query width override. The existing Playwright destination contract supplies the responsive regression test.

**Tech Stack:** React, TypeScript, vanilla CSS, Vitest, Playwright.

## Global Constraints

- Preserve the shared `#/plaza` destination, 46px minimum height, 3px navy border, yellow surface, offset shadow, and visible focus ring.
- Desktop back links must be naturally sized; mobile Archive must retain its existing route-width treatment.
- Do not change routes, component APIs, navigation behavior, persistence, breakpoints, or unrelated controls.
- Run the focused regression test before and after the CSS change, then run the full verification suite.

---

### Task 1: Compact the Archive back link on desktop

**Files:**
- Modify: `src/ui/styles.css:1120-1124` and preserve the existing mobile rule at `src/ui/styles.css:1653-1655`.
- Test: `tests/e2e/momo-consistency.spec.ts:160-180`.

**Interfaces:**
- Consumes: `.momo-back-link` base styles and `.momo-memory-garden-route > .momo-back-link` route layout styles.
- Produces: a shared back link whose desktop bounding-box width is below 400px while retaining its existing mobile width and accessibility contract.

- [x] **Step 1: Add the failing responsive assertion**

The existing destination test now checks the desktop bounding box without changing the component contract:

```ts
if (viewport.label === "desktop") {
  const box = await link.boundingBox();
  expect(box?.width ?? 0).toBeLessThan(400);
}
```

- [x] **Step 2: Run the focused test to verify it fails**

Run:

```bash
CI=1 npx playwright test -c tests/e2e/playwright.config.ts \
  tests/e2e/momo-consistency.spec.ts \
  -g 'uses one accessible Back to Plaza'
```

Expected: FAIL on the desktop Archive route because the current link width is approximately 1120px.

- [x] **Step 3: Remove the desktop width expansion**

In `src/ui/styles.css`, change the Archive route rule from:

```css
.momo-memory-garden-route > .momo-back-link {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  font-family: "Arial Rounded MT Bold", "Trebuchet MS", "IBM Plex Sans", sans-serif;
}
```

to:

```css
.momo-memory-garden-route > .momo-back-link {
  margin: 0 auto;
  font-family: "Arial Rounded MT Bold", "Trebuchet MS", "IBM Plex Sans", sans-serif;
}
```

Do not change the mobile override:

```css
.momo-memory-garden-route > .momo-back-link {
  width: min(100% - 24px, 560px);
}
```

- [x] **Step 4: Run the focused test to verify it passes**

Run the same focused command. Expected: the Archive and all other Plaza destination back links pass desktop compactness, 46px minimum height, 3px border, focus, and `#/plaza` assertions at both viewports.

- [x] **Step 5: Run the complete verification suite**

From the worktree, run:

```bash
npm test
npm run format:check
npm run lint
npm run typecheck
npm run vision:manifest:check
npm run build
CI=1 npx playwright test --pass-with-no-tests --config=tests/e2e
```

Expected: all commands exit successfully; unit tests remain 49 files / 219 tests and Playwright remains 25 passing tests.

- [x] **Step 6: Review the diff and commit**

Run:

```bash
git diff --check
git diff -- src/ui/styles.css tests/e2e/momo-consistency.spec.ts
git status --short
git add src/ui/styles.css tests/e2e/momo-consistency.spec.ts
git commit -m "style: compact Archive back link on desktop"
```

The commit must include only the focused CSS refinement and its regression assertion. Preserve unrelated untracked user files.
