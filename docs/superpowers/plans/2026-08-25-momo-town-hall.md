# Momo Town Hall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy `#/town-hall` settings route with a fully Momo-themed Mayor's Desk while preserving every existing setting and data-safety behavior.

**Architecture:** A dedicated `MomoTownHallScreen` owns Town Hall markup and presentation, receiving controlled values and callbacks from `App`. `App` continues to own persistence, reset, export, deletion confirmation, and extension state; it replaces the old `TownHallScreen` + `SettingsScreen` route composition with the dedicated screen. All new presentation is scoped below `.momo-town-hall`.

**Tech Stack:** React, TypeScript, Vitest + Testing Library, Playwright, CSS custom properties.

## Global Constraints

- Change only `#/town-hall`; leave the advanced-study `SettingsScreen` flow unchanged.
- Use only original in-repository Momo artwork; do not add remote or third-party Tamagotchi assets.
- Preserve duration, sensitivity, sound, reduced motion, reset, export, delete, privacy, and terms behavior.
- Preserve the existing typed local-data deletion confirmation and extension connection state.
- Keep focus states visible and keep the route free of horizontal overflow at a 390px viewport.

---

## File Structure

- Create: `src/ui/screens/MomoTownHallScreen.tsx` — controlled Mayor's Desk UI.
- Create: `src/ui/screens/MomoTownHallScreen.test.tsx` — component interaction and accessibility coverage.
- Modify: `src/app/App.tsx` — route `#/town-hall` to the new screen.
- Modify: `src/app/App.test.tsx` — regression test for the real hash route and deletion dialog.
- Modify: `src/ui/styles.css` — Town Hall-only Momo visual system and mobile layout.
- Modify: `tests/e2e/plaza.spec.ts` — direct Town Hall browser regression.
- Delete: `src/ui/screens/TownHallScreen.tsx` — obsolete legacy wrapper.

### Task 1: Build the controlled Momo Town Hall screen

**Files:**

- Create: `src/ui/screens/MomoTownHallScreen.tsx`
- Create: `src/ui/screens/MomoTownHallScreen.test.tsx`
- Modify: `src/ui/styles.css`

**Interfaces:**

- Consumes: `CompanionState`, `PresetName`, `SoundPreference`, and `FocusFriend`.
- Produces: `MomoTownHallScreen(props: MomoTownHallScreenProps)`, a semantic, fully controlled settings screen.

- [ ] **Step 1: Write the failing component test**

```tsx
it("renders Momo's Mayor's Desk and forwards preference controls", () => {
  const onDurationChange = vi.fn();
  const onPresetChange = vi.fn();
  const onSoundChange = vi.fn();
  const onReducedMotionChange = vi.fn();
  const onReset = vi.fn();
  const onExportData = vi.fn();
  const onDeleteData = vi.fn();

  render(
    <MomoTownHallScreen
      companion={createInitialPlazaState().companion}
      connection="connected"
      dataStatus="Your local data was deleted from this device."
      durationMs={25 * 60_000}
      onDeleteData={onDeleteData}
      onDurationChange={onDurationChange}
      onExportData={onExportData}
      onPresetChange={onPresetChange}
      onReducedMotionChange={onReducedMotionChange}
      onReset={onReset}
      onSoundChange={onSoundChange}
      preset="balanced"
      reducedMotion={false}
      sound="standard"
    />,
  );

  fireEvent.change(screen.getByLabelText("Next session length"), {
    target: { value: String(50 * 60_000) },
  });
  fireEvent.change(screen.getByLabelText("Momo's focus sensitivity"), {
    target: { value: "strict" },
  });
  fireEvent.change(screen.getByLabelText("Focus chime"), { target: { value: "soft" } });
  fireEvent.click(screen.getByLabelText("Use gentler motion"));
  fireEvent.click(screen.getByRole("button", { name: "Reset defaults" }));
  fireEvent.click(screen.getByRole("button", { name: "Export my data" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete my data" }));

  expect(screen.getByRole("heading", { name: "Momo's Town Hall" })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /Momo, encouraging/i })).toBeInTheDocument();
  expect(screen.getByText("Extension connected")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Your local data was deleted from this device.",
  );
  expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
    "href",
    "#/privacy",
  );
  expect(screen.getByRole("link", { name: "Terms of Use" })).toHaveAttribute("href", "#/terms");
  expect(onDurationChange).toHaveBeenCalledWith(50 * 60_000);
  expect(onPresetChange).toHaveBeenCalledWith("strict");
  expect(onSoundChange).toHaveBeenCalledWith("soft");
  expect(onReducedMotionChange).toHaveBeenCalledWith(true);
  expect(onReset).toHaveBeenCalledOnce();
  expect(onExportData).toHaveBeenCalledOnce();
  expect(onDeleteData).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Verify the test is red**

Run: `npm test -- src/ui/screens/MomoTownHallScreen.test.tsx --reporter=dot`

Expected: FAIL because `MomoTownHallScreen` does not exist.

- [ ] **Step 3: Implement the component and its root-scoped theme**

```tsx
export type MomoTownHallScreenProps = {
  companion: CompanionState;
  connection: "connected" | "disconnected";
  dataStatus: string | null;
  durationMs: number;
  onDeleteData: () => void;
  onDurationChange: (durationMs: number) => void;
  onExportData: () => void;
  onPresetChange: (preset: PresetName) => void;
  onReducedMotionChange: (reducedMotion: boolean) => void;
  onReset: () => void;
  onSoundChange: (sound: SoundPreference) => void;
  preset: PresetName;
  reducedMotion: boolean;
  sound: SoundPreference;
};
```

Render a `main.momo-town-hall` with:

- a `#/plaza` return link, a Town Hall label, and the existing connected/disconnected string;
- an encouraging `FocusFriend` hero headed `Momo's Town Hall`;
- native select labels `Next session length`, `Momo's focus sensitivity`, and `Focus chime`, retaining the current option values;
- the `Use gentler motion` checkbox;
- exact reset, export, and delete button names plus a `nav` labelled `Legal` with the current privacy and terms routes;
- a `role="status"` message only when `dataStatus` is non-null.

Add only `.momo-town-hall ...` style selectors: Momo cream/sky route background, thick navy outlines, pink/lemon/leaf cards, visible focus rings, and a `max-width: 620px` one-column layout. Reuse `--momo-*` tokens and the in-repository FocusFriend; do not alter generic settings or Plaza selectors.

- [ ] **Step 4: Verify the test is green**

Run: `npm test -- src/ui/screens/MomoTownHallScreen.test.tsx --reporter=dot`

Expected: PASS with every controlled callback and the Momo image verified.

- [ ] **Step 5: Commit the screen**

```bash
git add src/ui/screens/MomoTownHallScreen.tsx src/ui/screens/MomoTownHallScreen.test.tsx src/ui/styles.css
git commit -m "feat: add Momo Town Hall screen"
```

### Task 2: Route Town Hall through the dedicated screen

**Files:**

- Modify: `src/app/App.tsx:23,58,1039-1063`
- Modify: `src/app/App.test.tsx`
- Modify: `tests/e2e/plaza.spec.ts`
- Delete: `src/ui/screens/TownHallScreen.tsx`

**Interfaces:**

- Consumes: `MomoTownHallScreenProps` from Task 1 and existing App state/callbacks.
- Produces: `#/town-hall` renders Momo Town Hall and continues to open the existing `DeleteDialog`.

- [ ] **Step 1: Write the failing unit and browser hash-route regressions**

```tsx
it("opens the Plaza Town Hall as Momo's Mayor's Desk", () => {
  window.location.hash = "#/town-hall";
  render(<App />);

  expect(screen.getByRole("heading", { name: "Momo's Town Hall" })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /Momo, encouraging/i })).toBeInTheDocument();
  expect(screen.getByLabelText("Next session length")).toHaveValue(String(25 * 60_000));
  expect(
    screen.queryByRole("heading", { name: "Keep your study world yours" }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Delete my data" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
```

- Add this test to the `Momo's Plaza` Playwright suite before routing the app:

```ts
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
```

- [ ] **Step 2: Verify the test is red**

Run:

```bash
npm test -- src/app/App.test.tsx --reporter=dot
npx playwright test --config=tests/e2e tests/e2e/plaza.spec.ts --reporter=line
```

Expected: both checks FAIL because the route still renders the legacy `TownHallScreen` heading.

- [ ] **Step 3: Replace the route and remove the obsolete wrapper**

Replace the current Town Hall conditional with:

```tsx
if (session.phase === "setup" && route === "town-hall") {
  return (
    <>
      <MomoTownHallScreen
        companion={plazaState.companion}
        connection={courseGuardConnection}
        dataStatus={deleteStatus}
        durationMs={form.durationMs}
        onDeleteData={() => setDeleteDialogOpen(true)}
        onDurationChange={(durationMs) => setForm((current) => ({ ...current, durationMs }))}
        onExportData={exportData}
        onPresetChange={(preset: PresetName) => setForm((current) => ({ ...current, preset }))}
        onReducedMotionChange={setReducedMotion}
        onReset={resetSettings}
        onSoundChange={(sound) => setForm((current) => ({ ...current, sound }))}
        preset={form.preset ?? "balanced"}
        reducedMotion={reducedMotion}
        sound={form.sound}
      />
      {deleteDialogOpen && (
        <DeleteDialog onCancel={() => setDeleteDialogOpen(false)} onConfirm={deleteAllData} />
      )}
    </>
  );
}
```

Replace the `TownHallScreen` import with `MomoTownHallScreen`, retain `SettingsScreen` for advanced study tools, and delete the old wrapper after `rg -n "TownHallScreen" src tests` returns no matches.

- [ ] **Step 4: Verify the test is green**

Run:

```bash
npm test -- src/app/App.test.tsx --reporter=dot
npx playwright test --config=tests/e2e tests/e2e/plaza.spec.ts --reporter=line
```

Expected: both checks PASS with Momo Town Hall, its native select, deletion confirmation dialog, and no 390px horizontal overflow.

- [ ] **Step 5: Commit route integration**

```bash
git add src/app/App.tsx src/app/App.test.tsx src/ui/screens/TownHallScreen.tsx tests/e2e/plaza.spec.ts
git commit -m "feat: route Town Hall through Momo controls"
```

### Task 3: Run the full release-quality verification

**Files:**

- Verify only; do not add unrelated changes.

**Interfaces:**

- Consumes: the completed dedicated screen, route, and browser coverage.
- Produces: fresh evidence that the web app and extension still build and the project worktree is clean.

- [ ] **Step 1: Run the full quality gate**

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
git status --short --branch
```

Expected: every command exits 0, the unit suite includes the Town Hall regressions, the browser suite includes the direct route, and `git diff --check` emits no whitespace errors.

- [ ] **Step 2: Review the final diff against the specification**

Confirm the Town Hall-only scope, Momo hero, all existing preference/data/legal behaviors, native accessible inputs, visible focus, mobile stacking, and removal of the legacy wrapper.
