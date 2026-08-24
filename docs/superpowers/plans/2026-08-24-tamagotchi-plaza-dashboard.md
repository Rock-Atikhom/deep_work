# Tamagotchi Plaza Learning Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the setup-only Course Guard surface with an original Tamagotchi Plaza-inspired learning dashboard and a light local companion game loop while preserving the existing legacy study flows and extension authority.

**Architecture:** Add a pure `src/plaza` domain layer for companion state, rewards, cosmetics, and Course Guard session summaries. Extend the existing IndexedDB repository with a versioned plaza record, then render the plaza through focused React screens and components selected by the existing hash router. Extend the existing Course Guard reducer and bridge snapshot with return/session recovery data; keep the Chrome extension authoritative for browser enforcement and let the web app own presentation, history, and cosmetics.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest 4, Testing Library, IndexedDB via the existing repository, Manifest V3 Chrome extension, CSS tokens and inline CSS illustrations.

## Global Constraints

- Node `>=22.22.2 <23` and npm `10.9.7` remain the supported toolchain.
- All companion, reward, cosmetic, and session data stays local to the browser; add no server, account, cloud sync, analytics, or remote asset dependency.
- The Chrome extension remains the authoritative source for active Course Guard state and browser-origin enforcement.
- Preserve the existing camera, vision, timer, question deck, legal, export, and deletion seams for legacy flows.
- Course Guard must never claim to be active before extension confirmation.
- Do not store page content, screenshots, camera frames, detailed browsing history, or attention inference.
- Do not add hunger, illness, death, negative health, missed-day penalties, leaderboards, public profiles, or streak pressure.
- Use original visual assets and CSS/inline illustrations; do not copy Tamagotchi proprietary characters, artwork, names, or exact layouts.
- Keep sentence-case copy, visible keyboard focus, screen-reader labels, and `data-reduced-motion` behavior for every new interactive surface.
- Use TDD at each domain seam and run the existing project checks after integration.

---

## File Map

Create the following focused units:

- `src/plaza/plaza-types.ts` — versioned companion, cosmetic, plaza item, and Course Guard session-summary types.
- `src/plaza/plaza-rewards.ts` — deterministic growth, reward, and unlock calculations.
- `src/plaza/plaza-machine.ts` — pure companion/plaza reducer and guard-snapshot-to-mood mapping.
- `src/plaza/plaza-machine.test.ts` and `src/plaza/plaza-rewards.test.ts` — domain behavior tests.
- `src/ui/components/FocusFriend.tsx` — accessible original companion visual with state-driven expression.
- `src/ui/components/PlazaMeter.tsx` — labeled mood/energy/growth meter.
- `src/ui/components/PlazaDestinationCard.tsx` — accessible plaza location card.
- `src/ui/screens/PlazaHomeScreen.tsx` — town hub and primary focus action.
- `src/ui/screens/CourseGuardScreen.tsx` — extracted Course Guard setup and live status.
- `src/ui/screens/SessionArchiveScreen.tsx` — Course Guard and legacy session summaries.
- `src/ui/screens/WardrobeScreen.tsx` — cosmetic catalog/equip view.
- `src/ui/screens/TownHallScreen.tsx` — settings, extension connection, and local-data actions.
- `src/ui/plaza-dashboard.test.tsx` — route and accessible dashboard journeys.
- `tests/e2e/plaza.spec.ts` and `tests/e2e/playwright.config.ts` — production-bundle browser acceptance coverage.

Modify the following existing units:

- `src/app/hash-route.ts` and its test — add plaza destinations while preserving legacy routes.
- `src/app/App.tsx` — load/persist plaza state, connect guard events to the companion reducer, and route the new screens.
- `src/storage/repository.ts` and its test — persist/migrate plaza state and Course Guard summaries.
- `src/course-guard/bridge-contract.ts`, `src/course-guard/bridge.ts`, and their tests — validate the expanded authoritative snapshot.
- `extension/src/guard-machine.ts` and its tests — track returns, latest in-course location, permission loss, and completed/incomplete summaries.
- `extension/src/background.ts` — pass tab/time data into the reducer and recover safely from permission revocation.
- `extension/src/popup.html`, `extension/src/popup.ts`, and `extension/src/content.ts` — add the pocket companion and Plaza-style interruption.
- `src/ui/tokens.css`, `src/ui/styles.css`, and `DESIGN.md` — add the colorful plaza visual system without breaking legacy screens.
- `.github/workflows/ci.yml` only if the new browser config needs an explicit command; keep the existing `--pass-with-no-tests` fallback until a real spec exists.

---

### Task 1: Add the pure companion and reward domain

**Files:**
- Create: `src/plaza/plaza-types.ts`
- Create: `src/plaza/plaza-rewards.ts`
- Create: `src/plaza/plaza-machine.ts`
- Test: `src/plaza/plaza-rewards.test.ts`
- Test: `src/plaza/plaza-machine.test.ts`

**Interfaces:**
- Consumes: Course Guard phase/connection values and completed/incomplete session outcomes.
- Produces: `createInitialPlazaState()`, `reducePlazaState()`, `companionMoodForGuardState()`, `rewardForSession()`, and `nextUnlock()` for repository and React integration.

- [ ] **Step 1: Write failing reward tests**

```ts
import { describe, expect, it } from "vitest";
import { nextUnlock, rewardForSession } from "./plaza-rewards";

describe("plaza rewards", () => {
  it("rewards a completed focus session without punishing interruptions", () => {
    expect(
      rewardForSession({
        completionStatus: "completed",
        elapsedMs: 25 * 60_000,
        returnCount: 2,
      }),
    ).toMatchObject({ growthPoints: 25, rewardId: "sticker-sun" });
  });

  it("gives incomplete sessions a smaller positive reward", () => {
    expect(
      rewardForSession({ completionStatus: "incomplete", elapsedMs: 10 * 60_000, returnCount: 0 }),
    ).toMatchObject({ growthPoints: 10 });
  });

  it("returns the first locked cosmetic at the next threshold", () => {
    expect(nextUnlock({ growthPoints: 20, unlockedCosmeticIds: ["sticker-sun"] })).toEqual({
      id: "hat-leaf",
      kind: "companion",
      requiredGrowthPoints: 50,
    });
  });
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npx vitest run src/plaza/plaza-rewards.test.ts`

Expected: FAIL because the plaza reward module and exported functions do not exist yet.

- [ ] **Step 3: Implement the reward catalog and deterministic calculations**

Define these exact types and functions:

```ts
export type CosmeticKind = "companion" | "plaza";

export interface CosmeticDefinition {
  id: string;
  kind: CosmeticKind;
  label: string;
  requiredGrowthPoints: number;
}

export interface RewardInput {
  completionStatus: "completed" | "incomplete";
  elapsedMs: number;
  returnCount: number;
}

export interface SessionReward {
  growthPoints: number;
  rewardId: string | null;
}

export function rewardForSession(input: RewardInput): SessionReward;
export function nextUnlock(input: {
  growthPoints: number;
  unlockedCosmeticIds: string[];
}): CosmeticDefinition | null;
```

Use one growth point per focused minute, cap a single session at 50 points, grant a minimum of one point for any session with positive elapsed time, and select the first catalog item whose threshold is reached. `returnCount` must not reduce the reward.

- [ ] **Step 4: Write failing reducer tests**

```ts
import { describe, expect, it } from "vitest";
import { companionMoodForGuardState, createInitialPlazaState, reducePlazaState } from "./plaza-machine";

describe("plaza companion state", () => {
  it("moves through ready, focusing, encouraging, and proud states", () => {
    let state = createInitialPlazaState();
    expect(state.companion.mood).toBe("ready");
    state = reducePlazaState(state, { type: "SESSION_STARTED" });
    expect(state.companion.mood).toBe("focusing");
    state = reducePlazaState(state, { type: "DISTRACTION_DETECTED" });
    expect(state.companion.mood).toBe("encouraging");
    state = reducePlazaState(state, {
      type: "SESSION_COMPLETED",
      outcome: {
        completionStatus: "completed",
        elapsedMs: 25 * 60_000,
        finishedAtMs: 2_500,
        id: "guard-1",
        returnCount: 1,
        startedAtMs: 1_000,
        courseOrigin: "https://learn.example.com",
        courseLabel: "learn.example.com",
      },
    });
    expect(state.companion.mood).toBe("proud");
    expect(state.courseGuardSessions).toHaveLength(1);
    expect(state.companion.growthPoints).toBeGreaterThan(0);
  });

  it("maps disconnected and permission-lost states without claiming focus", () => {
    expect(companionMoodForGuardState({ connection: "disconnected", phase: "idle" })).toBe(
      "resting",
    );
    expect(companionMoodForGuardState({ connection: "connected", phase: "permission-lost" })).toBe(
      "encouraging",
    );
  });
});
```

- [ ] **Step 5: Run the reducer test to verify it fails**

Run: `npx vitest run src/plaza/plaza-machine.test.ts`

Expected: FAIL because the plaza state types and reducer do not exist yet.

- [ ] **Step 6: Implement the pure state model**

Define these exact exported types:

```ts
export const PLAZA_SCHEMA_VERSION = 1 as const;
export type CompanionMood = "resting" | "ready" | "focusing" | "proud" | "encouraging";

export interface CompanionState {
  name: string;
  mood: CompanionMood;
  energy: number;
  growthPoints: number;
  level: number;
  equippedCosmeticIds: string[];
  unlockedCosmeticIds: string[];
  unlockedPlazaItemIds: string[];
}

export interface CourseGuardSessionRecord {
  id: string;
  courseOrigin: string;
  courseLabel: string;
  startedAtMs: number;
  finishedAtMs: number;
  elapsedMs: number;
  returnCount: number;
  completionStatus: "completed" | "incomplete";
  growthPoints: number;
  rewardId: string | null;
}

export interface PlazaState {
  schemaVersion: typeof PLAZA_SCHEMA_VERSION;
  companion: CompanionState;
  courseGuardSessions: CourseGuardSessionRecord[];
}
```

Implement `createInitialPlazaState()` with companion name `Momo`, mood `ready`, energy `100`, growth `0`, level `1`, empty equipped cosmetics, and empty history. Implement `reducePlazaState()` for `SESSION_STARTED`, `DISTRACTION_DETECTED`, `RETURNED_TO_COURSE`, `BREAK_TAKEN`, `SESSION_COMPLETED`, `SESSION_ENDED`, and `EQUIP_COSMETIC`. Clamp energy and growth-derived level deterministically; never create a negative state.

Implement `companionMoodForGuardState(input: { connection: "connected" | "disconnected"; phase: "idle" | "watching" | "interruption" | "permission-lost" })` so disconnected maps to `resting`, idle to `ready`, watching to `focusing`, and interruption/permission-lost to `encouraging`.

- [ ] **Step 7: Run the focused domain tests**

Run: `npx vitest run src/plaza/plaza-rewards.test.ts src/plaza/plaza-machine.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit the domain seam**

Run: `git add src/plaza && git commit -m "feat: add local plaza companion domain"`

Expected: one commit containing only the new pure plaza modules and tests.

---

### Task 2: Persist plaza state and Course Guard session summaries

**Files:**
- Modify: `src/storage/repository.ts`
- Modify: `src/storage/repository.test.ts`
- Test: `src/plaza/plaza-machine.test.ts` only if repository normalization exposes a domain regression

**Interfaces:**
- Consumes: `PlazaState`, `createInitialPlazaState()`, and `CourseGuardSessionRecord` from Task 1.
- Produces: `RepositorySnapshot.plaza`, `savePlaza()`, and normalized legacy snapshots that always contain a valid plaza state.

- [ ] **Step 1: Add a failing repository migration test**

```ts
it("hydrates plaza defaults when reading a legacy root", async () => {
  const repository = await openDeepWorkRepository({ databaseName: databaseName() });
  const snapshot = await repository.load();

  expect(snapshot.plaza).toMatchObject({
    schemaVersion: 1,
    companion: { mood: "ready", energy: 100, growthPoints: 0, level: 1 },
    courseGuardSessions: [],
  });
  repository.close();
});
```

- [ ] **Step 2: Add failing persistence and deletion tests**

```ts
it("persists companion cosmetics and Course Guard history independently of legacy summaries", async () => {
  const repository = await openDeepWorkRepository({ databaseName: databaseName() });
  const snapshot = await repository.load();
  const next = {
    ...snapshot.plaza,
    companion: { ...snapshot.plaza.companion, growthPoints: 50, level: 2, equippedCosmeticIds: ["hat-leaf"] },
    courseGuardSessions: [
      {
        completionStatus: "completed" as const,
        courseLabel: "learn.example.com",
        courseOrigin: "https://learn.example.com",
        elapsedMs: 1_500,
        finishedAtMs: 2_500,
        growthPoints: 2,
        id: "guard-1",
        returnCount: 1,
        rewardId: "sticker-sun",
        startedAtMs: 1_000,
      },
    ],
  };

  await repository.savePlaza(next);
  await expect(repository.load()).resolves.toMatchObject({ plaza: next });
  const cleared = await repository.deleteAllData();
  expect(cleared.plaza.companion.growthPoints).toBe(0);
  expect(cleared.plaza.courseGuardSessions).toEqual([]);
  repository.close();
});
```

- [ ] **Step 3: Implement normalized plaza persistence**

Add `plaza: PlazaState` to `RepositorySnapshot` and `StoredRoot`. Keep `STORAGE_SCHEMA_VERSION` at `1` and version the new nested record with `PLAZA_SCHEMA_VERSION` so existing session/deck data is not invalidated. Add `plaza` to `emptyRoot()` and `initialRoot()`.

Implement:

```ts
savePlaza(plaza: PlazaState): Promise<RepositorySnapshot>;
```

Before returning from `readRoot()`, normalize missing or malformed plaza fields to `createInitialPlazaState()`, clamp numeric fields to non-negative values, and filter unknown cosmetic IDs. `deleteAllData()` must reset plaza state while retaining the existing behavior for legacy decks/preferences. Include the plaza record in `exportData()` and ensure `importDeck()` does not alter it.

- [ ] **Step 4: Run repository tests**

Run: `npx vitest run src/storage/repository.test.ts`

Expected: PASS, including the existing legacy persistence assertions.

- [ ] **Step 5: Commit the persistence seam**

Run: `git add src/storage/repository.ts src/storage/repository.test.ts && git commit -m "feat: persist local plaza progress"`

Expected: one commit containing repository changes and tests only.

---

### Task 3: Expand authoritative Course Guard lifecycle data

**Files:**
- Modify: `extension/src/guard-machine.ts`
- Modify: `extension/src/guard-machine.test.ts`
- Modify: `extension/src/background.ts`
- Modify: `src/course-guard/bridge-contract.ts`
- Modify: `src/course-guard/bridge-contract.test.ts`
- Modify: `src/course-guard/bridge.ts`
- Modify: `src/course-guard/bridge.test.ts`
- Modify: `extension/src/messages.ts`

**Interfaces:**
- Consumes: current `GuardState`, bridge protocol version `1`, selected course URL, and active tab updates.
- Produces: a backwards-compatible bridge snapshot with `returnCount`, latest in-course tab/URL, session start time, permission-lost phase, and the last completed/incomplete session summary.

- [ ] **Step 1: Write failing reducer tests for returns and fallback**

```ts
it("records the latest in-course URL and counts each interruption-to-course return once", () => {
  let state = reduceGuard(createGuardState(), {
    atMs: 1_000,
    courseUrl: "https://learn.example.com/lesson/1",
    tabId: 4,
    type: "START",
  });
  state = reduceGuard(state, { tabId: 7, url: "https://social.example.com", type: "ACTIVE_TAB_CHANGED" });
  state = reduceGuard(state, { tabId: 8, url: "https://learn.example.com/lesson/2", type: "ACTIVE_TAB_CHANGED" });

  expect(state).toMatchObject({
    phase: "watching",
    interruptionCount: 1,
    returnCount: 1,
    latestInCourseTabId: 8,
    latestInCourseUrl: "https://learn.example.com/lesson/2",
  });
});

it("creates an incomplete session when permission is revoked", () => {
  const started = reduceGuard(createGuardState(), {
    atMs: 1_000,
    courseUrl: "https://learn.example.com/lesson/1",
    tabId: 4,
    type: "START",
  });
  const lost = reduceGuard(started, { atMs: 2_000, type: "PERMISSION_REVOKED" });
  expect(lost.phase).toBe("permission-lost");
  expect(lost.lastSession).toMatchObject({ completionStatus: "incomplete", finishedAtMs: 2_000 });
});
```

- [ ] **Step 2: Run guard tests to verify they fail**

Run: `npx vitest run extension/src/guard-machine.test.ts`

Expected: FAIL because the reducer does not accept tab/time fields or expose return/session recovery data.

- [ ] **Step 3: Extend the reducer types and implementation**

Change `GuardPhase` to include `"permission-lost"`. Extend `GuardState` with `returnCount`, `latestInCourseUrl`, `latestInCourseTabId`, `sessionId`, `sessionStartedAtMs`, and `lastSession`. Extend events as follows:

```ts
type GuardEvent =
  | { type: "START"; atMs: number; courseUrl: string; tabId: number }
  | { type: "ACTIVE_TAB_CHANGED"; tabId: number; url: string }
  | { type: "PERMISSION_REVOKED"; atMs: number }
  | { type: "RETURN_TO_COURSE" }
  | { type: "STOP"; atMs: number };
```

On `START`, create a new session ID, record the starting tab/URL, and reset counts. On same-origin tab changes, update the latest in-course URL/tab without changing counts. On the first cross-origin transition from `watching`, increment `interruptionCount` once and enter `interruption`; on the first transition back to the course origin, increment `returnCount` once and resume `watching`. On `STOP`, produce a completed or incomplete `lastSession` with elapsed time and reset active fields. On `PERMISSION_REVOKED`, preserve the session summary as incomplete and enter `permission-lost` until the user stops or starts a new session.

- [ ] **Step 4: Update bridge schemas and parser tests**

Mirror the reducer fields in `CourseGuardSnapshot` and add `CourseGuardSessionSnapshot`. Update `isCourseGuardSnapshot()` to reject negative counts, invalid phase values, malformed URLs, or an active phase without session metadata. Keep protocol version `1` because this is an additive payload change accepted by the same app/extension pair. Update the parser tests for a valid extended snapshot and malformed permission-lost payload.

- [ ] **Step 5: Update background tab and permission handling**

Pass `tab.id`, `tab.url`, and `Date.now()` into reducer events. Change `returnToCourse()` to use `latestInCourseTabId` and `latestInCourseUrl` first, then the setup `courseUrl` as fallback; never navigate to a generic page. Subscribe to `chrome.permissions.onRemoved` and dispatch `PERMISSION_REVOKED` only when the removed origin matches the active course origin. Check the selected origin before `START_GUARD`; if unavailable, return `permission-needed` without changing guard state. Keep extension storage writes and content overlay messages synchronized with the resulting phase.

- [ ] **Step 6: Update web bridge typing and state propagation**

Keep `CourseGuardBridge` command signatures unchanged. Update response parsing and state events so the React app receives the extended snapshot and can persist `lastSession` when a stop or incomplete transition is confirmed. Preserve the rule that connection loss clears the web app’s active claim and shows a recoverable disconnected state.

- [ ] **Step 7: Run all guard and bridge tests**

Run: `npx vitest run extension/src/guard-machine.test.ts extension/src/external-bridge.test.ts src/course-guard/bridge-contract.test.ts src/course-guard/bridge.test.ts`

Expected: PASS, including existing handshake, origin allowlist, permission-needed, and command serialization tests.

- [ ] **Step 8: Commit the authoritative lifecycle changes**

Run: `git add extension/src src/course-guard && git commit -m "feat: add Course Guard session recovery state"`

Expected: one commit containing reducer, bridge, background, and test changes only.

---

### Task 4: Add plaza routes, screens, and accessible companion components

**Files:**
- Modify: `src/app/hash-route.ts`
- Modify: `src/app/hash-route.test.ts`
- Create: `src/ui/components/FocusFriend.tsx`
- Create: `src/ui/components/PlazaMeter.tsx`
- Create: `src/ui/components/PlazaDestinationCard.tsx`
- Create: `src/ui/screens/PlazaHomeScreen.tsx`
- Create: `src/ui/screens/CourseGuardScreen.tsx`
- Create: `src/ui/screens/SessionArchiveScreen.tsx`
- Create: `src/ui/screens/WardrobeScreen.tsx`
- Create: `src/ui/screens/TownHallScreen.tsx`
- Test: `src/ui/plaza-dashboard.test.tsx`

**Interfaces:**
- Consumes: `PlazaState`, extended `CourseGuardSnapshot`, current setup form handlers, and existing `HistoryScreen`/`SettingsScreen` data actions.
- Produces: route-driven screens that can be mounted from `App.tsx` without accessing Chrome APIs or IndexedDB directly.

- [ ] **Step 1: Add route parser tests**

```ts
it("recognizes the plaza destinations", () => {
  expect(parseHashRoute("#/plaza")).toBe("plaza");
  expect(parseHashRoute("#/course-guard")).toBe("course-guard");
  expect(parseHashRoute("#/archive")).toBe("archive");
  expect(parseHashRoute("#/wardrobe")).toBe("wardrobe");
  expect(parseHashRoute("#/town-hall")).toBe("town-hall");
});
```

- [ ] **Step 2: Extend `AppRoute` and preserve legacy route parsing**

Add `plaza`, `course-guard`, `archive`, `wardrobe`, and `town-hall` to the route union and `ROUTES`. Make `welcome` format to the plaza home in the setup-phase shell; leave `focus`, `calibration`, `quick-review`, `reflection`, `decks`, `history`, `settings`, `privacy`, and `terms` parseable for legacy users and existing deep links.

- [ ] **Step 3: Write failing dashboard accessibility tests**

```tsx
it("renders the plaza home with the companion, primary action, and destinations", () => {
  render(
    <PlazaHomeScreen
      companion={createInitialPlazaState().companion}
      connection="connected"
      guardPhase="idle"
      onNavigate={() => undefined}
      onStartFocus={() => undefined}
      recentSessions={[]}
    />,
  );

  expect(screen.getByRole("heading", { name: /learning plaza/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /start a focus session/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /course guard/i })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /momo, ready/i })).toBeInTheDocument();
});
```

- [ ] **Step 4: Implement `FocusFriend`, meters, and destination cards**

`FocusFriend` must accept `{ name, mood, cosmeticIds, reducedMotion }`, expose an image-like accessible label through `role="img"`, and render an original CSS/inline-SVG companion with state classes. `PlazaMeter` must accept `{ label, value, max, tone }`, expose `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`, and include visible text values. `PlazaDestinationCard` must render an anchor/button with a label, description, and state badge without relying on color alone.

- [ ] **Step 5: Implement the plaza home screen**

Render a centered Focus Friend scene, mood/energy/level meters, progress to the next unlock, a single primary **Start a focus session** button, destination links, connection status, and the latest reward/session card. Keep the layout usable at 320px width and keyboard navigable in DOM order.

- [ ] **Step 6: Extract Course Guard and build the three destinations**

Move the existing Course Guard URL, goal, start/stop, permission, and connection copy into `CourseGuardScreen` as controlled props/callbacks. `SessionArchiveScreen` must show an empty state and records with duration, returns, completion status, growth, and reward. `WardrobeScreen` must show locked/unlocked cosmetics, allow only unlocked IDs to be equipped, and announce the equip result. `TownHallScreen` must wrap the existing settings, data export/delete, reduced-motion, and extension recovery actions without duplicating repository logic.

- [ ] **Step 7: Run dashboard tests and preserve legacy UI tests**

Run: `npx vitest run src/ui/plaza-dashboard.test.tsx src/app/hash-route.test.ts src/app/App.test.tsx src/app/App.course-guard.test.tsx`

Expected: PASS after `App.tsx` is wired to the new screen props; existing legacy setup/focus assertions remain valid unless their text intentionally moves to a named plaza destination.

- [ ] **Step 8: Commit the route and screen layer**

Run: `git add src/app/hash-route.ts src/app/hash-route.test.ts src/ui && git commit -m "feat: add Learning Plaza dashboard screens"`

Expected: one commit containing the route and presentational screen layer, with no repository or extension changes.

---

### Task 5: Integrate plaza state with App and Course Guard events

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.course-guard.test.tsx`
- Modify: `src/app/App.persistence.test.tsx`
- Modify: `src/ui/plaza-dashboard.test.tsx`

**Interfaces:**
- Consumes: `RepositorySnapshot.plaza`, `reducePlazaState()`, `companionMoodForGuardState()`, route screens, and the extended `CourseGuardBridgeEvent`.
- Produces: one authoritative React orchestration layer that starts/stops guard only through the bridge and persists companion/session changes through the repository.

- [ ] **Step 1: Add failing app journey assertions**

```tsx
it("shows the companion focusing only after the extension confirms guard start", async () => {
  const fakeBridge = createFakeBridge();
  render(<App courseGuardBridge={fakeBridge.bridge} />);
  act(() => {
    fakeBridge.emit({ status: "connected", type: "connection" });
    fakeBridge.emit({ state: idleState, type: "state" });
  });

  expect(screen.getByRole("img", { name: /momo, ready/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: /course guard/i }));
  fireEvent.click(screen.getByRole("button", { name: /start course guard/i }));
  expect(await screen.findByRole("img", { name: /momo, focusing/i })).toBeInTheDocument();
});
```

Add assertions for one completed guard record, an incomplete permission-loss record, and persisted cosmetics after a reload-shaped repository load.

- [ ] **Step 2: Load plaza state during existing hydration**

Initialize App state from `initialSnapshot.plaza`, hydrate it from `repository.load()`, and keep the legacy `session` state and plaza state separate. Do not mark `focusing` or any guard-active label from a local button click; update the plaza reducer only after the bridge emits the confirmed watching snapshot.

- [ ] **Step 3: Map bridge events to companion states**

In the existing bridge subscription, map `connected/idle` to ready, `watching` to focusing, `interruption` to encouraging, `permission-lost` to encouraging with recovery copy, and disconnect to resting. Apply `SESSION_STARTED`, `DISTRACTION_DETECTED`, `RETURNED_TO_COURSE`, and `SESSION_COMPLETED`/`SESSION_ENDED` exactly once per state transition. Deduplicate repeated bridge snapshots by session ID, phase, and counts.

- [ ] **Step 4: Persist completed and incomplete Course Guard records**

When the bridge reports `lastSession`, append it through `reducePlazaState()` and call `repository.savePlaza()`. Keep the current guard session out of completed history until the extension confirms stop or an incomplete terminal state. If the bridge disconnects, show recovery without inventing a completion record.

- [ ] **Step 5: Route setup into the plaza shell**

Render `PlazaHomeScreen` for the default setup/welcome route. Render `CourseGuardScreen`, `SessionArchiveScreen`, `WardrobeScreen`, and `TownHallScreen` for their new routes. Keep the existing camera-aware/timer-only focus session form available from the Course Guard station and preserve the existing focus/reflection route behavior.

- [ ] **Step 6: Add navigation and recovery copy**

Provide persistent links between plaza destinations, a visible current-location label, and a recovery action for disconnected extension, missing permission, invalid URL, missing tab, and unavailable local storage. Ensure the web app never tells the learner that a guard is active when the bridge is disconnected or unacknowledged.

- [ ] **Step 7: Run app tests**

Run: `npx vitest run src/app src/ui/plaza-dashboard.test.tsx src/storage/repository.test.ts`

Expected: PASS, including existing camera-free and legacy session journeys.

- [ ] **Step 8: Commit the integration layer**

Run: `git add src/app src/ui src/storage && git commit -m "feat: connect plaza dashboard to guard state"`

Expected: one commit containing app orchestration and persistence integration only.

---

### Task 6: Refresh the extension popup and interruption overlay

**Files:**
- Modify: `extension/src/popup.html`
- Modify: `extension/src/popup.ts`
- Modify: `extension/src/content.ts`
- Modify: `extension/src/messages.ts`
- Test: `extension/src/popup-view.test.ts` if a pure view-model helper is extracted

**Interfaces:**
- Consumes: extended `GuardState` snapshots and existing `ExtensionMessage`/`ExtensionResponse` types.
- Produces: compact pocket companion popup, accessible interruption overlay, and safe actions for start, stop, return, and open plaza.

- [ ] **Step 1: Extract a pure popup view model before changing DOM code**

Create `extension/src/popup-view.ts` with:

```ts
export interface PopupViewModel {
  companionMood: "resting" | "ready" | "focusing" | "encouraging";
  status: string;
  primaryAction: "start" | "stop" | "return";
  primaryLabel: string;
  courseLabel: string;
  progressLabel: string;
}

export function popupViewModel(state: GuardState): PopupViewModel;
```

Test idle, watching, interruption, permission-lost, and malformed/missing course data without touching Chrome APIs.

- [ ] **Step 2: Redesign popup markup and styles**

Make `popup.html` a 320px-or-smaller pocket device: companion visual, course/status text, progress/return count, one primary action, **Open plaza** link/button, and an alert region. Keep the current `GET_STATE`, `START_GUARD`, and `STOP_GUARD` message flow; route **Return to course** to `RETURN_TO_COURSE` when the phase is interruption.

- [ ] **Step 3: Add popup recovery behavior**

Show permission-needed, disconnected, invalid URL, and worker failure as readable recovery messages. Disable only the action currently awaiting a response. Do not show a fake focusing state while the background worker has not confirmed the start.

- [ ] **Step 4: Redesign the content interruption**

Render an original CSS/inline companion face, course label, short supportive copy, **Back to course**, and a safe secondary **Close** action only when the guard state permits it. Keep `role="dialog"`, `aria-modal`, labelled title, focus on the primary button, Escape support, keyboard operation, z-index isolation, and a `prefers-reduced-motion`/`data-reduced-motion`-safe animation path. Never include unrelated browsing history or page content.

- [ ] **Step 5: Build the extension and run extension tests**

Run: `npx vitest run extension/src && npm run extension:build`

Expected: PASS and a valid `dist-extension/manifest.json`, `popup.js`, `background.js`, and `content.js` bundle.

- [ ] **Step 6: Commit the extension surface**

Run: `git add extension/src && git commit -m "feat: give Course Guard a pocket companion"`

Expected: one commit containing popup/overlay view changes and tests.

---

### Task 7: Apply the Plaza visual system and update product documentation

**Files:**
- Modify: `src/ui/tokens.css`
- Modify: `src/ui/styles.css`
- Modify: `DESIGN.md`
- Modify: `CONTEXT.md` if the product handoff still describes the editorial-only direction
- Test: `src/ui/plaza-dashboard.test.tsx`

**Interfaces:**
- Consumes: classes and data attributes from Tasks 4–6.
- Produces: a responsive, colorful, accessible plaza treatment with no dependency on external images or font downloads beyond existing bundled fonts.

- [ ] **Step 1: Add plaza tokens without removing legacy tokens**

Add named variables for sky, grass, coral, sun, water, plum, panel, ink, muted ink, outline, success, and danger. Add `--plaza-radius-card: 20px`, `--plaza-radius-pill: 999px`, and motion durations. Keep `--paper`, `--ink`, `--botanical`, and existing legacy variables so the camera/session screens do not regress.

- [ ] **Step 2: Style the plaza shell and destination cards**

Implement responsive styles for the town background, central scene, status meters, destination grid, archive cards, wardrobe catalog, and town hall panels. Use layered CSS backgrounds and simple geometric shapes for the plaza environment. Ensure controls remain high-contrast against decorative surfaces and the layout collapses to one column below 760px.

- [ ] **Step 3: Add companion states and unlock motion**

Use short transform/opacity animations for ready, focusing, encouraging, and proud states. Disable nonessential animation when `html[data-reduced-motion="true"]` or `prefers-reduced-motion: reduce` is active. Do not animate meters continuously or hide status changes in motion.

- [ ] **Step 4: Check accessibility and visual behavior in tests**

Add assertions for visible labels, meter values, keyboard-reachable destination links, and reduced-motion data attributes. Run the focused dashboard tests at the existing jsdom boundary; use the browser acceptance task for computed layout and keyboard checks.

- [ ] **Step 5: Update design/handoff documentation**

Replace the editorial-only web/extension direction in `DESIGN.md` with the approved Plaza direction: colorful town hub, companion-centered state, light rewards/cosmetics, compact pocket extension, original assets, and non-punitive study mechanics. Keep the privacy and local-first constraints explicit in `CONTEXT.md`.

- [ ] **Step 6: Run formatting and lint checks**

Run: `npm run format:check && npm run lint && npm run typecheck`

Expected: PASS with no unused plaza props, invalid ARIA attributes, or formatting drift.

- [ ] **Step 7: Commit the visual system**

Run: `git add src/ui/tokens.css src/ui/styles.css DESIGN.md CONTEXT.md && git commit -m "feat: style the app as Learning Plaza"`

Expected: one commit containing visual tokens, responsive styles, and documentation only.

---

### Task 8: Add browser acceptance coverage and perform the full verification pass

**Files:**
- Create: `tests/e2e/playwright.config.ts`
- Create: `tests/e2e/plaza.spec.ts`
- Modify: `.github/workflows/ci.yml` only if required to run the new config without the pass-through flag
- Modify: `docs/browser-extension.md` with the manual unpacked-extension acceptance sequence

**Interfaces:**
- Consumes: production web build, route-based plaza UI, local IndexedDB, and the existing test/build commands.
- Produces: a deterministic browser path for plaza rendering and a documented manual Chrome extension path for real permission/tab behavior.

- [ ] **Step 1: Create the Playwright config**

Configure `tests/e2e/playwright.config.ts` to use Chromium, start the Vite preview on `127.0.0.1:4173`, and keep tests serial because they share the preview process. Set the base URL to `http://127.0.0.1:4173` and use a short trace-on-first-retry policy.

- [ ] **Step 2: Write the plaza browser journey**

```ts
import { test, expect } from "@playwright/test";

test("learner can open the plaza, inspect the companion, and reach Course Guard", async ({ page }) => {
  await page.goto("/#/plaza");
  await expect(page.getByRole("heading", { name: /learning plaza/i })).toBeVisible();
  await expect(page.getByRole("img", { name: /momo/i })).toBeVisible();
  await page.getByRole("link", { name: /course guard/i }).click();
  await expect(page.getByRole("heading", { name: /course guard/i })).toBeVisible();
  await expect(page.getByLabel("Course URL")).toBeVisible();
});
```

Add a second test that sets reduced motion, reloads, returns to `#/plaza`, and verifies the companion name and local progress shell remain available. Keep this browser suite independent of Chrome extension APIs; real extension permission and cross-origin behavior remains a manual acceptance path.

- [ ] **Step 3: Document manual Chrome acceptance**

Update `docs/browser-extension.md` with exact steps: build the web app and extension, load `dist-extension` as an unpacked extension, open the local plaza, verify bridge connection, grant selected course origin, start guard, switch to another origin, use the overlay’s **Back to course**, verify latest URL fallback, stop guard, revoke permission during a session, restart the worker, and confirm incomplete-session recovery.

- [ ] **Step 4: Run the full quality suite**

Run:

```bash
npm run vision:manifest:check
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run extension:build
npx --yes playwright@1.62.0 test --config=tests/e2e
git diff --check
```

Expected: every command exits `0`; the browser suite reports at least the new plaza tests; extension build emits a loadable Manifest V3 bundle.

- [ ] **Step 5: Commit acceptance coverage**

Run: `git add tests/e2e docs/browser-extension.md .github/workflows/ci.yml && git commit -m "test: cover Learning Plaza acceptance path"`

Expected: one commit containing browser acceptance coverage and extension QA documentation.

- [ ] **Step 6: Report verification and remaining manual checks**

Record the exact command results, the loaded browser routes, and any manual Chrome checks that require a real extension permission prompt. Do not claim the full extension acceptance path passed from jsdom or a production web test alone.

---

## Self-review checklist

- Spec coverage: tasks cover plaza home, companion states, rewards, cosmetics, session archive, town hall, extension popup, interruption overlay, local persistence, guard authority, permission loss, return fallback, accessibility, reduced motion, browser acceptance, and documentation.
- Placeholder scan: the plan contains no unresolved placeholders or unspecified implementation step.
- Type consistency: `PlazaState`, `CourseGuardSessionRecord`, `CourseGuardSnapshot`, `GuardState`, `rewardForSession()`, `reducePlazaState()`, and `popupViewModel()` are named once and reused consistently.
- Scope: camera/vision legacy flows remain outside the redesign; full shop mini-games, multiplayer, sound, accounts, and cloud sync are explicitly deferred.
- Verification: every task ends with a focused test/build command and a scoped commit.
