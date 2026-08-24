# Momo Game Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `#/plaza` into an original, game-first Momo dashboard with visible care actions, a toy-town HUD, rewards, and clear Course Guard entry while preserving the existing local-only learning model.

**Architecture:** Keep Plaza state and persistence in the existing reducer/repository boundary. Add a typed `CARE_ACTION` reducer event that changes only the already-persisted companion energy and mood fields. Reshape `PlazaHomeScreen` into composable HUD, room, care-bar, map, and quest regions; `App` remains the only place that connects UI intents to persisted state and routes.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Playwright, CSS, IndexedDB repository.

## Global Constraints

- Keep Momo and all interface art original; do not use Tamagotchi names, characters, logos, or assets.
- Care is local and non-punitive: no currency, cooldowns, streaks, energy decay, hunger, illness, or failure state.
- Feed adds 10 energy and sets `ready`; Play adds 4 energy and sets `proud`; Rest adds 6 energy and sets `resting`; all cap at 100.
- Only Course Guard session outcomes add growth or unlock rewards.
- Course Guard remains extension-authoritative; a disconnected web app must not claim a guard is active.
- Preserve legacy timer/camera flows outside `#/plaza`.
- Use labelled native buttons, visible keyboard focus, textual status, responsive layout, and `prefers-reduced-motion` support.
- Run `npm test`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run extension:build`, `npm run vision:manifest:check`, and `npx playwright test --config=tests/e2e` before handoff.

---

## File structure

| File | Responsibility |
| --- | --- |
| `src/plaza/plaza-machine.ts` | Typed care-action reducer behavior and energy cap. |
| `src/plaza/plaza-machine.test.ts` | Reducer-level proof that care changes mood/energy, never growth. |
| `src/ui/components/PlazaGameHud.tsx` | Compact game status bar for level, energy, growth, rewards, and guard state. |
| `src/ui/components/CareActionBar.tsx` | Four labelled dashboard actions that emit Feed, Play, Rest, or Study intent. |
| `src/ui/components/PlazaMap.tsx` | Toy-town route cards for Course Guard, Wardrobe, Archive, and Town Hall. |
| `src/ui/screens/PlazaHomeScreen.tsx` | Game-first composition: HUD, Momo room, care bar, map, and quest panel. |
| `src/ui/plaza-dashboard.test.tsx` | Component behavior and accessibility assertions for the new dashboard. |
| `src/app/App.tsx` | Connects `CARE_ACTION` intent to persisted Plaza state. |
| `src/app/App.persistence.test.tsx` | Verifies care action survives repository reload. |
| `src/ui/styles.css` | Responsive original toy-town visual system and reduced-motion rules. |
| `tests/e2e/plaza.spec.ts` | Browser proof of care actions, keyboard reachability, and Course Guard navigation. |

## Task 1: Add the persisted care reducer event

**Files:**
- Modify: `src/plaza/plaza-machine.ts`
- Modify: `src/plaza/plaza-machine.test.ts`

**Interfaces:**
- Produces: `export type CareAction = "feed" | "play" | "rest"`.
- Produces: `PlazaEvent` variant `{ type: "CARE_ACTION"; action: CareAction }`.
- Consumed by: `PlazaHomeScreen` and `App` in Tasks 2 and 3.

- [ ] **Step 1: Write the failing reducer tests**

```ts
it("applies each care action without granting study growth", () => {
  const initial = {
    ...createInitialPlazaState(),
    companion: { ...createInitialPlazaState().companion, energy: 50 },
  };

  expect(reducePlazaState(initial, { action: "feed", type: "CARE_ACTION" }).companion).toMatchObject({
    energy: 60,
    growthPoints: 0,
    mood: "ready",
  });
  expect(reducePlazaState(initial, { action: "play", type: "CARE_ACTION" }).companion).toMatchObject({
    energy: 54,
    growthPoints: 0,
    mood: "proud",
  });
  expect(reducePlazaState(initial, { action: "rest", type: "CARE_ACTION" }).companion).toMatchObject({
    energy: 56,
    growthPoints: 0,
    mood: "resting",
  });
});

it("caps care energy at one hundred", () => {
  const state = {
    ...createInitialPlazaState(),
    companion: { ...createInitialPlazaState().companion, energy: 94 },
  };

  expect(reducePlazaState(state, { action: "feed", type: "CARE_ACTION" }).companion.energy).toBe(100);
});
```

- [ ] **Step 2: Run the focused tests and confirm the missing event fails**

Run: `npm test -- src/plaza/plaza-machine.test.ts`

Expected: TypeScript/Vitest failure because `CARE_ACTION` and `CareAction` do not yet exist.

- [ ] **Step 3: Implement the minimal typed event and effect table**

```ts
export type CareAction = "feed" | "play" | "rest";

const careEffects: Record<CareAction, { energy: number; mood: CompanionMood }> = {
  feed: { energy: 10, mood: "ready" },
  play: { energy: 4, mood: "proud" },
  rest: { energy: 6, mood: "resting" },
};

// Add to PlazaEvent:
| { type: "CARE_ACTION"; action: CareAction }

// Add to reducePlazaState:
case "CARE_ACTION": {
  const effect = careEffects[event.action];
  return {
    ...state,
    companion: {
      ...state.companion,
      energy: clampEnergy(state.companion.energy + effect.energy),
      mood: effect.mood,
    },
  };
}
```

- [ ] **Step 4: Run the focused reducer tests and full unit suite**

Run: `npm test -- src/plaza/plaza-machine.test.ts && npm test`

Expected: all Plaza reducer tests and the full Vitest suite pass.

- [ ] **Step 5: Commit the reducer slice**

```bash
git add src/plaza/plaza-machine.ts src/plaza/plaza-machine.test.ts
git commit -m "feat: add Momo care actions"
```

## Task 2: Build the game dashboard component boundaries

**Files:**
- Create: `src/ui/components/PlazaGameHud.tsx`
- Create: `src/ui/components/CareActionBar.tsx`
- Create: `src/ui/components/PlazaMap.tsx`
- Modify: `src/ui/screens/PlazaHomeScreen.tsx`
- Modify: `src/ui/plaza-dashboard.test.tsx`

**Interfaces:**
- Consumes: `CareAction`, `CompanionState`, `CourseGuardSessionRecord`, `AppRoute`, and `nextUnlock`.
- Produces: `PlazaHomeScreenProps.onCare(action: CareAction): void` and `onStartFocus(): void`.
- Consumed by: `App` in Task 3 and Playwright in Task 5.

- [ ] **Step 1: Write the failing dashboard interaction tests**

```tsx
it("renders the game HUD, care actions, and Course Guard map entry", () => {
  const onCare = vi.fn();
  const onStartFocus = vi.fn();
  render(
    <PlazaHomeScreen
      companion={createInitialPlazaState().companion}
      connection="connected"
      guardPhase="idle"
      onCare={onCare}
      onStartFocus={onStartFocus}
      recentSessions={[]}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Feed Momo" }));
  fireEvent.click(screen.getByRole("button", { name: "Study with Momo" }));

  expect(screen.getByRole("heading", { name: "Momo's Plaza" })).toBeInTheDocument();
  expect(screen.getByText(/Level 1/i)).toBeInTheDocument();
  expect(onCare).toHaveBeenCalledWith("feed");
  expect(onStartFocus).toHaveBeenCalledOnce();
  expect(screen.getByRole("link", { name: /Course Guard/i })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Momo's Plaza map" })).toHaveClass("momo-plaza-map");
});
```

- [ ] **Step 2: Run the dashboard test and confirm it fails on the absent controls**

Run: `npm test -- src/ui/plaza-dashboard.test.tsx`

Expected: failure because `onCare`, `Feed Momo`, `Study with Momo`, and the new heading do not exist.

- [ ] **Step 3: Create the focused components**

```tsx
// CareActionBar.tsx
export function CareActionBar({ onCare, onStudy }: {
  onCare: (action: CareAction) => void;
  onStudy: () => void;
}) {
  return (
    <section aria-label="Care for Momo" className="momo-care-bar">
      <button type="button" onClick={() => onCare("feed")}>Feed Momo</button>
      <button type="button" onClick={() => onCare("play")}>Play with Momo</button>
      <button type="button" onClick={() => onCare("rest")}>Let Momo rest</button>
      <button type="button" onClick={onStudy}>Study with Momo</button>
    </section>
  );
}
```

```tsx
// PlazaGameHud.tsx
export function PlazaGameHud({ companion, guardStatus, rewardCount }: {
  companion: CompanionState;
  guardStatus: string;
  rewardCount: number;
}) {
  return (
    <header className="momo-game-hud">
      <strong>{companion.name}'s Plaza</strong>
      <span>LV {companion.level}</span>
      <span>{companion.energy}% energy</span>
      <span>{companion.growthPoints} growth</span>
      <span>{rewardCount} rewards</span>
      <span>{guardStatus}</span>
    </header>
  );
}
```

`PlazaMap` must render `<nav aria-label="Momo's Plaza map" className="momo-plaza-map">` with four
semantic route links: Course Guard, Reward Chest (to `#/wardrobe`), Session Archive, and Town Hall.
`PlazaHomeScreen` must compose those components around the existing `FocusFriend`, show the next
unlock, keep the existing status mapping, and make `Study with Momo` call `onStartFocus`.

- [ ] **Step 4: Run the dashboard tests and verify accessible controls**

Run: `npm test -- src/ui/plaza-dashboard.test.tsx`

Expected: the home dashboard test passes and existing archive/wardrobe assertions remain green.

- [ ] **Step 5: Commit the dashboard component slice**

```bash
git add src/ui/components/PlazaGameHud.tsx src/ui/components/CareActionBar.tsx src/ui/components/PlazaMap.tsx src/ui/screens/PlazaHomeScreen.tsx src/ui/plaza-dashboard.test.tsx
git commit -m "feat: build Momo game dashboard"
```

## Task 3: Wire care actions through the app and persistence boundary

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.persistence.test.tsx`

**Interfaces:**
- Consumes: `PlazaHomeScreenProps.onCare` and reducer event `{ type: "CARE_ACTION"; action }`.
- Produces: a persisted Plaza update after a dashboard care action.
- Depends on: Tasks 1 and 2.

- [ ] **Step 1: Write the failing app persistence test**

```tsx
it("persists a Momo care action from the Plaza dashboard", async () => {
  const repository = await openDeepWorkRepository({ databaseName: databaseName() });
  window.location.hash = "#/plaza";
  render(<App repository={repository} />);

  await screen.findByRole("heading", { name: "Momo's Plaza" });
  fireEvent.click(screen.getByRole("button", { name: "Let Momo rest" }));

  await waitFor(async () => {
    const snapshot = await repository.load();
    expect(snapshot.plaza.companion).toMatchObject({ energy: 100, mood: "resting" });
  });
  repository.close();
});
```

- [ ] **Step 2: Run the focused test and confirm it fails before the callback is wired**

Run: `npm test -- src/app/App.persistence.test.tsx`

Expected: failure because the rendered dashboard has no care callback or named Rest button.

- [ ] **Step 3: Pass care intent from `App` into the dashboard**

```tsx
<PlazaHomeScreen
  // existing props
  onCare={(action) =>
    setPlazaState((current) => reducePlazaState(current, { action, type: "CARE_ACTION" }))
  }
  onStartFocus={() => {
    window.location.hash = "#/course-guard";
  }}
/>
```

Do not add direct repository calls here. The existing Plaza-state persistence effect must continue to
save the reducer result.

- [ ] **Step 4: Run focused persistence and full tests**

Run: `npm test -- src/app/App.persistence.test.tsx && npm test`

Expected: care action is stored and all existing tests pass.

- [ ] **Step 5: Commit the app integration**

```bash
git add src/app/App.tsx src/app/App.persistence.test.tsx
git commit -m "feat: persist Plaza care interactions"
```

## Task 4: Apply the original toy-town visual system

**Files:**
- Modify: `src/ui/styles.css`
- Modify: `src/ui/tokens.css`

**Interfaces:**
- Consumes: CSS classes emitted by Task 2: `momo-game-hud`, `momo-care-bar`, `momo-plaza-map`,
  `momo-room`, and `momo-today-quest`.
- Produces: desktop and mobile game-first presentation without changing route logic.

- [ ] **Step 1: Confirm the semantic component contracts are green before styling**

Run: `npm test -- src/ui/plaza-dashboard.test.tsx`

Expected: the Task 2 dashboard test passes with a labelled care region and a semantic Plaza map;
CSS work must not change their accessible names or roles.

- [ ] **Step 2: Implement the visual system**

Add named game tokens in `src/ui/tokens.css`:

```css
:root {
  --momo-sky: #9ddcff;
  --momo-pink: #ff9fc4;
  --momo-lemon: #ffd95a;
  --momo-leaf: #79c779;
  --momo-ink: #24324a;
  --momo-cream: #fff9ea;
}
```

In `src/ui/styles.css`, replace the Plaza route's editorial heading treatment with rounded,
toy-like display styling; frame the Momo room with sky/grass layers; give HUD, buttons, and map
tiles thick `--momo-ink` outlines with small offset shadows; use a responsive four-column map that
becomes two columns then one column. Add a single `momo-idle` animation and disable it inside the
existing `prefers-reduced-motion: reduce` block.

- [ ] **Step 3: Run the focused dashboard test and inspect a browser screenshot**

Run: `npm test -- src/ui/plaza-dashboard.test.tsx`

Then run: `npx playwright test --config=tests/e2e --grep "game dashboard"`

Expected: dashboard test passes; browser screenshot shows Momo, HUD, care controls, and map in the
first viewport at a 1440px desktop width.

- [ ] **Step 4: Commit the visual slice**

```bash
git add src/ui/styles.css src/ui/tokens.css src/ui/plaza-dashboard.test.tsx
git commit -m "style: make Learning Plaza game-first"
```

## Task 5: Update browser acceptance and run the release checks

**Files:**
- Modify: `tests/e2e/plaza.spec.ts`

**Interfaces:**
- Consumes: exact accessible labels from Tasks 2–4.
- Produces: browser coverage for game dashboard behavior and responsive layout.

- [ ] **Step 1: Replace the old editorial-page acceptance expectations with failing game-dashboard expectations**

```ts
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
```

- [ ] **Step 2: Run the browser suite and confirm it fails until the new dashboard is complete**

Run: `npx playwright test --config=tests/e2e`

Expected: failures for absent game-dashboard labels before Tasks 2–4 are implemented.

- [ ] **Step 3: Run all required verification commands**

Run:

```bash
npm test
npm run format:check
npm run lint
npm run typecheck
npm run build
npm run extension:build
npm run vision:manifest:check
npx playwright test --config=tests/e2e
git diff --check
```

Expected: all commands exit successfully.

- [ ] **Step 4: Commit the acceptance coverage**

```bash
git add tests/e2e/plaza.spec.ts
git commit -m "test: cover Momo game dashboard"
```

## Plan self-review

- Spec coverage: Tasks 1–3 implement the persisted low-stakes care loop; Tasks 2 and 4 establish
  the game HUD, Momo room, map, rewards visibility, original visual identity, accessibility, and
  responsive behavior; Task 5 supplies browser and release verification.
- Scope: no backend, currency, streaks, punitive mechanics, third-party art, or stable extension-ID
  work is included.
- Consistency: every dashboard callback is defined in Task 2, connected in Task 3, and asserted in
  Task 5. Growth remains tied to the existing Course Guard terminal events from Task 1 onward.
- Placeholder scan: no incomplete tasks or unspecified interfaces remain.
