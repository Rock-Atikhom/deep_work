# Momo Session Reward Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the core Deep Work session-complete state into a persisted Momo reward moment that returns the student to Momo's Plaza.

**Architecture:** A pure adapter maps the existing core `SessionState` terminal data to the already-persisted `PlazaSessionOutcome` contract. `App` invokes that adapter exactly once while handling reflection, then renders a focused reward screen that consumes the resulting Momo state. Existing Plaza persistence, reward definitions, and CSS Momo art remain the single sources of truth.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, Playwright, IndexedDB, CSS custom properties.

## Global Constraints

- Reuse the existing `SESSION_COMPLETED` / `SESSION_ENDED` Plaza reducer events and reward thresholds; do not add a second reward store or change the Plaza schema.
- A missing or legacy core `sessionId` must not create a Plaza reward record.
- Do not use Tamagotchi names, logos, third-party images, remote fonts, or new runtime dependencies.
- Keep the existing session summary, export, history, legal, device-local saving, and Course Guard behavior intact.
- Use accessible labels, semantic headings, visible keyboard focus, and `prefers-reduced-motion`-safe styling.

---

## File Structure

- `src/plaza/core-session-outcome.ts` — maps a completed core timer state into the stable Plaza outcome contract.
- `src/plaza/core-session-outcome.test.ts` — covers valid mappings and invalid/legacy timer states.
- `src/ui/screens/SessionRewardScreen.tsx` — presentation-only Momo completion experience.
- `src/ui/session-reward.test.tsx` — verifies reward content, accessibility, and return interaction.
- `src/app/App.tsx` — dispatches the one-time Plaza terminal event, renders the reward screen, and routes back to Plaza.
- `src/app/App.persistence.test.tsx` — verifies the reflected session persists one Plaza record across remounts.
- `src/ui/styles.css` — scoped reward-screen visual system and small-viewport layout.
- `tests/e2e/plaza.spec.ts` — browser journey from a core session through reflection, reward, and Plaza return.

### Task 1: Map a core timer session to a Plaza outcome

**Files:**
- Create: `src/plaza/core-session-outcome.ts`
- Create: `src/plaza/core-session-outcome.test.ts`

**Interfaces:**
- Consumes: `SessionState` from `src/session/session-machine.ts` and `PlazaSessionOutcome` from `src/plaza/plaza-types.ts`.
- Produces: `plazaOutcomeFromCoreSession(session: SessionState): PlazaSessionOutcome | null`.
- Used by: `App.chooseReflection` in Task 3.

- [ ] **Step 1: Write failing adapter tests**

```ts
import { createSessionState, reduceSession } from "../session/session-machine";
import { describe, expect, it } from "vitest";
import { plazaOutcomeFromCoreSession } from "./core-session-outcome";

describe("plazaOutcomeFromCoreSession", () => {
  it("maps a completed core timer to a stable Plaza outcome", () => {
    const started = reduceSession(createSessionState({
      durationMs: 25 * 60_000, goal: "Review joins", sound: "silent", subject: "SQL",
    }), { atMs: 1_000, sessionId: "core-1", type: "START" });
    const completed = reduceSession(started, { atMs: 1_501_000, type: "TICK" });

    expect(plazaOutcomeFromCoreSession(completed)).toEqual({
      completionStatus: "completed",
      courseLabel: "SQL",
      courseOrigin: "deep-work://local",
      elapsedMs: 25 * 60_000,
      finishedAtMs: 1_501_000,
      id: "core-1",
      returnCount: 0,
      startedAtMs: 1_000,
    });
  });

  it("rejects a terminal state without a stable session identifier", () => {
    const state = { ...createSessionState({ durationMs: 1, goal: "Read", sound: "silent", subject: "Math" }), phase: "complete" as const };
    expect(plazaOutcomeFromCoreSession(state)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails because the module does not exist**

Run: `npm test -- src/plaza/core-session-outcome.test.ts`

Expected: FAIL with a module-resolution error for `./core-session-outcome`.

- [ ] **Step 3: Implement the pure adapter**

```ts
import type { SessionState } from "../session/session-machine";
import type { PlazaSessionOutcome } from "./plaza-types";

export function plazaOutcomeFromCoreSession(session: SessionState): PlazaSessionOutcome | null {
  if (
    session.sessionId === null ||
    session.sessionStartedAtMs === null ||
    session.finishedAtMs === null ||
    session.finishReason === null
  ) return null;

  return {
    id: session.sessionId,
    courseOrigin: "deep-work://local",
    courseLabel: session.config.subject,
    startedAtMs: session.sessionStartedAtMs,
    finishedAtMs: session.finishedAtMs,
    elapsedMs: session.elapsedMs,
    returnCount: 0,
    completionStatus: session.finishReason,
  };
}
```

- [ ] **Step 4: Run the focused adapter test and confirm it passes**

Run: `npm test -- src/plaza/core-session-outcome.test.ts`

Expected: PASS with both mapping and legacy-state cases green.

- [ ] **Step 5: Commit the adapter and its tests**

```bash
git add src/plaza/core-session-outcome.ts src/plaza/core-session-outcome.test.ts
git commit -m "feat: map timer sessions to Plaza outcomes"
```

### Task 2: Build the presentation-only Momo reward screen

**Files:**
- Create: `src/ui/screens/SessionRewardScreen.tsx`
- Create: `src/ui/session-reward.test.tsx`

**Interfaces:**
- Consumes: `CompanionState`, `CosmeticDefinition | null`, `FocusFriend`, and `PlazaGameHud`.
- Produces: `SessionRewardScreen(props: SessionRewardScreenProps)` with `onReturnToPlaza(): void`.
- Used by: the terminal `complete` rendering path in `App` in Task 3.

- [ ] **Step 1: Write the failing component test**

```tsx
render(
  <SessionRewardScreen
    companion={{ ...createInitialPlazaState().companion, growthPoints: 25, mood: "proud" }}
    earnedGrowth={25}
    goal="Review joins"
    nextUnlock={{ id: "hat-leaf", kind: "companion", label: "Leaf cap", requiredGrowthPoints: 50 }}
    onReturnToPlaza={onReturnToPlaza}
    reflection="Yes"
    rewardCount={1}
    savedLocally
    subject="SQL"
  />,
);

expect(screen.getByRole("heading", { name: /Momo is proud/i })).toBeInTheDocument();
expect(screen.getByText("+25 growth")).toBeInTheDocument();
expect(screen.getByText(/Next unlock: Leaf cap/i)).toBeInTheDocument();
fireEvent.click(screen.getByRole("button", { name: "Back to Momo's Plaza" }));
expect(onReturnToPlaza).toHaveBeenCalledOnce();
```

- [ ] **Step 2: Run the focused component test and confirm it fails because the screen is absent**

Run: `npm test -- src/ui/session-reward.test.tsx`

Expected: FAIL with a module-resolution error for `./screens/SessionRewardScreen`.

- [ ] **Step 3: Implement the screen with a narrow, explicit prop interface**

```tsx
export interface SessionRewardScreenProps {
  companion: CompanionState;
  earnedGrowth: number;
  goal: string;
  nextUnlock: CosmeticDefinition | null;
  onReturnToPlaza: () => void;
  reflection: string;
  rewardCount: number;
  savedLocally: boolean;
  subject: string;
}

export function SessionRewardScreen({ companion, earnedGrowth, goal, nextUnlock, onReturnToPlaza, reflection, rewardCount, savedLocally, subject }: SessionRewardScreenProps) {
  return (
    <main className="session-reward-shell" aria-labelledby="session-reward-title">
      <PlazaGameHud companion={companion} guardStatus="Reward time" rewardCount={rewardCount} />
      <section className="session-reward-card">
        <FocusFriend equippedCosmeticIds={companion.equippedCosmeticIds} mood="proud" name={companion.name} />
        <p className="plaza-eyebrow">Focus reward</p>
        <h1 id="session-reward-title">Momo is proud of you!</h1>
        <p>{subject} · {goal}</p>
        <p>Reflection: {reflection}</p>
        <section aria-label="Session reward"><strong>+{earnedGrowth} growth</strong></section>
        <p>{nextUnlock ? `Next unlock: ${nextUnlock.label}` : "Every Plaza reward is unlocked."}</p>
        <p>{savedLocally ? "Your session and Momo's progress are saved on this device." : "Your session and Momo's progress are available for this visit only."}</p>
        <button className="plaza-primary-button" type="button" onClick={onReturnToPlaza}>Back to Momo&apos;s Plaza</button>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Run the component test and confirm the reward content and return control pass**

Run: `npm test -- src/ui/session-reward.test.tsx`

Expected: PASS with accessible heading, reward copy, next unlock, and button interaction verified.

- [ ] **Step 5: Commit the reward screen and its test**

```bash
git add src/ui/screens/SessionRewardScreen.tsx src/ui/session-reward.test.tsx
git commit -m "feat: add Momo session reward screen"
```

### Task 3: Award the reflected core session exactly once and return to Plaza

**Files:**
- Modify: `src/app/App.tsx: plaza imports, chooseReflection, terminal complete rendering`
- Modify: `src/app/App.persistence.test.tsx: core-session completion test`

**Interfaces:**
- Consumes: `plazaOutcomeFromCoreSession(session)`, `rewardForSession(outcome)`, `nextUnlock(...)`, and `SessionRewardScreen`.
- Produces: an exactly-once Plaza terminal reducer dispatch when a core reflection is chosen; `Back to Momo's Plaza` resets the core timer and sets `window.location.hash` to `#/plaza`.
- Depends on: Task 1 and Task 2.

- [ ] **Step 1: Update the persistence test to fail on missing Plaza growth**

```tsx
fireEvent.click(screen.getByRole("button", { name: "Yes" }));

await waitFor(async () => {
  const snapshot = await repository.load();
  expect(snapshot.plaza.courseGuardSessions).toHaveLength(1);
  expect(snapshot.plaza.courseGuardSessions[0]).toMatchObject({
    courseLabel: "SQL",
    courseOrigin: "deep-work://local",
  });
});

expect(screen.getByRole("heading", { name: /Momo is proud/i })).toBeInTheDocument();
rendered.unmount();
render(<App repository={repository} />);
await waitFor(async () => {
  const snapshot = await repository.load();
  expect(snapshot.plaza.courseGuardSessions).toHaveLength(1);
});
```

Create the test timer state with `reduceSession` and a known `sessionId`, `sessionStartedAtMs`, `finishedAtMs`, and non-zero `elapsedMs` before saving it as active. This makes the expected stored growth deterministic.

- [ ] **Step 2: Run the focused persistence test and confirm it fails because core reflections do not create a Plaza record**

Run: `npm test -- src/app/App.persistence.test.tsx`

Expected: FAIL in the updated completion case with `courseGuardSessions` still empty.

- [ ] **Step 3: Wire the adapter into the reflection handler and terminal route**

```tsx
function chooseReflection(value: Reflection) {
  const outcome = plazaOutcomeFromCoreSession(session);
  if (outcome) {
    const event: PlazaEvent = outcome.completionStatus === "completed"
      ? { type: "SESSION_COMPLETED", outcome }
      : { type: "SESSION_ENDED", outcome };
    setPlazaState((current) => reducePlazaState(current, event));
  }
  dispatchEvent(setSession, { atMs: nowMs, type: "REFLECT", value });
}

function returnToPlaza() {
  setSession((current) => reduceSession(current, { type: "RESET" }));
  window.location.hash = "#/plaza";
}
```

In the `complete` branch, derive `outcome`, `earnedGrowth`, and `nextUnlock` from the current session and Plaza state, then render `SessionRewardScreen`. Preserve `ProgressShelf`, delete dialog, and `LegalFooter` beneath it. Do not dispatch a reducer event while rendering.

- [ ] **Step 4: Run the focused persistence test and confirm it passes across remount**

Run: `npm test -- src/app/App.persistence.test.tsx`

Expected: PASS with one saved summary, one core-derived Plaza record, deterministic growth, and no second award after remount.

- [ ] **Step 5: Commit the integration and persistence coverage**

```bash
git add src/app/App.tsx src/app/App.persistence.test.tsx
git commit -m "feat: reward reflected timer sessions in Plaza"
```

### Task 4: Apply the game-first responsive visual treatment

**Files:**
- Modify: `src/ui/styles.css: add .session-reward-* rules near existing Plaza rules and narrow viewport rules`
- Modify: `src/ui/session-reward.test.tsx: add an all-unlocks and fallback-saving assertion`

**Interfaces:**
- Consumes: the semantic classes emitted by `SessionRewardScreen`.
- Produces: a desktop card composition and one-column 390px mobile layout without overflow; no new JavaScript behavior.
- Depends on: Task 2.

- [ ] **Step 1: Add a failing test for the all-rewards state**

```tsx
render(<SessionRewardScreen {...props} nextUnlock={null} savedLocally={false} />);

expect(screen.getByText("Every Plaza reward is unlocked.")).toBeInTheDocument();
expect(screen.getByText(/available for this visit only/i)).toBeInTheDocument();
```

- [ ] **Step 2: Run the reward-screen test and confirm the new fallback content fails**

Run: `npm test -- src/ui/session-reward.test.tsx`

Expected: FAIL until the all-unlocked and session-only strings are rendered.

- [ ] **Step 3: Add scoped toy-town styles and reduced-motion protection**

```css
.session-reward-shell {
  display: grid;
  gap: clamp(18px, 3vw, 32px);
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: clamp(18px, 4vw, 44px) 0;
}

.session-reward-card {
  display: grid;
  justify-items: center;
  gap: 16px;
  border: 4px solid var(--momo-ink);
  border-radius: 28px;
  padding: clamp(24px, 6vw, 64px);
  background: var(--momo-cream);
  box-shadow: 8px 8px 0 var(--momo-ink);
  text-align: center;
}

@media (max-width: 540px) {
  .session-reward-shell { width: min(100% - 24px, 460px); }
  .session-reward-card { padding: 24px 18px; }
}
```

Use the existing Momo palette tokens and focus treatment. If adding a celebratory CSS animation, define its static end state first and disable it inside the project’s existing `prefers-reduced-motion: reduce` media query.

- [ ] **Step 4: Run the component test and inspect its all-unlocks/fallback states**

Run: `npm test -- src/ui/session-reward.test.tsx`

Expected: PASS with both the next-unlock and all-unlocked states accessible.

- [ ] **Step 5: Commit the styling and state coverage**

```bash
git add src/ui/styles.css src/ui/session-reward.test.tsx
git commit -m "style: unify session rewards with Momo Plaza"
```

### Task 5: Validate the browser journey and full project contract

**Files:**
- Modify: `tests/e2e/plaza.spec.ts`

**Interfaces:**
- Consumes: the core setup, focus, reflection, `SessionRewardScreen`, and `#/plaza` routes.
- Produces: a browser proof that the old editorial completion screen is absent from the live application journey.
- Depends on: Tasks 1-4.

- [ ] **Step 1: Add a failing end-to-end journey**

```ts
test("turns a reflected timer session into a Momo reward and returns to Plaza", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Subject").fill("SQL");
  await page.getByLabel("Session goal").fill("Review joins");
  await page.getByRole("button", { name: "Start session" }).click();
  await page.getByRole("button", { name: "End session" }).click();
  await page.getByRole("button", { name: "Yes" }).click();

  await expect(page.getByRole("heading", { name: /Momo is proud/i })).toBeVisible();
  await expect(page.getByText("Session complete", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to Momo's Plaza" }).click();
  await expect(page).toHaveURL(/#\/plaza$/);
  await expect(page.getByRole("heading", { name: "Momo's Plaza" })).toBeVisible();
});
```

- [ ] **Step 2: Run the browser test and confirm it fails before the reward integration is present**

Run: `npx playwright test --config=tests/e2e tests/e2e/plaza.spec.ts`

Expected: FAIL because the Momo reward heading and return button do not exist.

- [ ] **Step 3: Run the browser journey at a narrow mobile viewport**

```ts
test("keeps the Momo reward return path reachable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Repeat the setup, end, reflection, and reward steps above.
  await page.getByRole("button", { name: "Back to Momo's Plaza" }).focus();
  await expect(page.locator(":focus")).toBeVisible();
});
```

Run: `npx playwright test --config=tests/e2e tests/e2e/plaza.spec.ts`

Expected: PASS with the desktop reward flow, existing Plaza coverage, and keyboard-reachable mobile return control.

- [ ] **Step 4: Run all required verification commands**

Run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run extension:build
npm run vision:manifest:check
npx playwright test --config=tests/e2e
git diff --check
git status --short --branch
```

Expected: every command exits 0; the final status reports only the committed feature branch with no working-tree changes.

- [ ] **Step 5: Commit the browser coverage**

```bash
git add tests/e2e/plaza.spec.ts
git commit -m "test: cover Momo session reward journey"
```
