# Deep Work Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a private, voluntary study-focus PWA that detects possible attention shifts locally, provides supportive interventions, and stores only non-biometric progress data on the student's device.

**Architecture:** A React and TypeScript application uses a pure session reducer, a pure awareness policy, an isolated camera session, and a MediaPipe Web Worker that disposes transferred `ImageBitmap` frames after inference. IndexedDB stores settings, local question decks, summaries, and permanent garden progress; a custom service worker verifies and caches pinned vision assets for offline reuse.

**Tech Stack:** Node.js 22.22.2, npm 10.9.7, React 19.2.8, TypeScript 6.0.3, Vite 8.1.5, Tailwind CSS 4.3.3, MediaPipe Tasks Vision 0.10.35, Vitest 4.1.10, Testing Library 16.3.2, Playwright 1.62.0, vite-plugin-pwa 1.3.0, fake-indexeddb 6.2.5, and axe-core Playwright 4.13.0.

## Global Constraints

- Official camera-awareness support is current desktop Chrome and Edge on Windows and macOS.
- Camera participation is voluntary; timer-only use must always remain available.
- The product uses "possible distraction" and "awareness event" language, never proof-of-distraction language.
- Camera frames, landmarks, blendshapes, transformation matrices, iris geometry, calibration offsets, and frame-level timelines must never enter persistent storage or a network request.
- Camera analysis pauses with zero counted events when the page is hidden, minimized, on break, or manually paused.
- The first release has no backend, account, analytics, advertising, remote AI, cloud synchronization, or classroom surveillance feature.
- Balanced defaults are 5 seconds for downward gaze or head away, 10 seconds for face absence, 2 seconds of recovery, a 30-second alert cooldown, and a 5-minute notes pause.
- Reuse may come only from `Rock-Atikhom/smile_detection` commit `4b78615bcc32eb9579fb39020df02ca59943ca09`; record adapted files in `docs/architecture/provenance.md`.
- Do not copy source or assets from `strawluck/mcdonalds-application-doomscroller`; credit it only as conceptual inspiration.
- Original code uses the MIT License and preserves all MediaPipe licenses, notices, and model cards.
- The visual system uses Newsreader and IBM Plex Sans, warm paper, ink blue, botanical green, mineral taupe, 0 to 2px radii, no gradients, no shadows, no emoji, no icon library, and no decorative hover animation.
- The deployed base path is `/deep_work/`; all runtime, worker, manifest, service-worker, and legal-page URLs must work under that path.
- Every task follows test-driven development and ends in a focused commit.

---

## File and responsibility map

```text
index.html                              HTML entry and metadata
package.json                            pinned commands and dependencies
vite.config.ts                          React, Tailwind, PWA, and base-path build
playwright.config.ts                    production-bundle browser tests
eslint.config.mjs                       TypeScript and React lint rules
prettier.config.mjs                     formatting rules
src/app/App.tsx                         route and session-screen composition
src/app/hash-route.ts                   GitHub Pages-safe hash routing
src/app/app-path.ts                     base-path-aware asset resolution
src/session/session-types.ts            session domain contracts
src/session/session-machine.ts          pure session reducer and timer math
src/awareness/types.ts                  observation and policy contracts
src/awareness/presets.ts                exact default thresholds
src/awareness/awareness-policy.ts       dwell, recovery, and cooldown logic
src/camera/session.ts                   camera lifecycle and recoverable errors
src/camera/use-camera-session.ts        React adapter for CameraSession
src/vision/protocol.ts                  validated worker command and event union
src/vision/face-frame-pump.ts           bounded ImageBitmap capture and transfer
src/vision/observation.ts               raw result to normalized local observation
src/vision/calibration.ts               worker-local baseline collection
src/vision/worker-runtime.ts            MediaPipe worker lifecycle and disposal
src/vision/worker.ts                    worker entry
src/vision/vision-client.ts             main-thread worker coordinator
src/vision/manifest.ts                  strict release-manifest parser
src/vision/release.ts                   generated pinned release exports
src/vision/integrity.ts                 SHA-256 response validation
src/storage/types.ts                    allowed persistent records
src/storage/repository.ts               versioned IndexedDB adapter
src/storage/export.ts                   local export and deletion coordination
src/content/deck-schema.ts              strict question-deck validation
src/content/sql-sample.json             bundled SQL review deck
src/alerts/sound.ts                     user-initiated Web Audio chime
src/ui/screens/*                        focused product screens
src/ui/components/*                     dialog, skeleton, status, garden artwork
src/ui/tokens.css                       approved visual tokens
src/ui/styles.css                       responsive and accessibility styles
src/service-worker/sw.ts                shell and verified vision caching
src/service-worker/client.ts            registration and offline status
scripts/vision-release.config.mjs       pinned MediaPipe asset inventory
scripts/generate-vision-manifest.mjs    deterministic manifest generator
public/vision/*                         vendored runtime, model, licenses, notices
docs/legal/privacy.md                   versioned privacy policy source
docs/legal/terms.md                     versioned terms source
docs/architecture/provenance.md         exact reused-file provenance
docs/validation/device-matrix.md        manual supported-device evidence
tests/e2e/*                             production-bundle acceptance tests
src/test/e2e-adapters.ts                loopback-only deterministic E2E injection
```

### Task 1: Bootstrap the tested application shell

**Files:**
- Create: `.nvmrc`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `eslint.config.mjs`
- Create: `prettier.config.mjs`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/App.test.tsx`
- Create: `src/test/setup.ts`
- Create: `src/ui/tokens.css`
- Create: `src/ui/styles.css`

**Interfaces:**
- Consumes: none
- Produces: `App(): JSX.Element`, the root `#root` mount, test commands, build commands, and approved global visual tokens.

- [ ] **Step 1: Declare the pinned workspace and dependencies**

Create `.nvmrc` with `22.22.2`. Create `package.json` with these scripts and exact dependency versions:

```json
{
  "name": "deep-work-companion",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=22.22.2 <23", "npm": "10.9.7" },
  "packageManager": "npm@10.9.7",
  "scripts": {
    "dev": "vite",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "vision:manifest:check": "node scripts/generate-vision-manifest.mjs --check"
  },
  "dependencies": {
    "@fontsource-variable/newsreader": "5.3.0",
    "@fontsource/ibm-plex-sans": "5.3.0",
    "@mediapipe/tasks-vision": "0.10.35",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.13.0",
    "@eslint/js": "10.0.1",
    "@playwright/test": "1.62.0",
    "@tailwindcss/vite": "4.3.3",
    "@testing-library/jest-dom": "7.0.0",
    "@testing-library/react": "16.3.2",
    "@types/node": "26.1.2",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "6.0.4",
    "eslint": "10.8.0",
    "eslint-plugin-react-hooks": "7.0.1",
    "eslint-plugin-react-refresh": "0.4.26",
    "fake-indexeddb": "6.2.5",
    "globals": "17.8.0",
    "jsdom": "30.1.0",
    "prettier": "3.9.0",
    "tailwindcss": "4.3.3",
    "typescript": "6.0.3",
    "typescript-eslint": "8.65.0",
    "vite": "8.1.5",
    "vite-plugin-pwa": "1.3.0",
    "vitest": "4.1.10"
  }
}
```

Run: `npm install --package-lock-only`

Expected: `package-lock.json` records npm lockfile version 3 without changing the declared versions.

Run: `npm ci`

Expected: the pinned dependency tree installs successfully and `npm --version` reports `10.9.7` before any quality command is run.

- [ ] **Step 2: Write the failing shell test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("introduces the voluntary local-only product", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Make space for focused learning" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Camera processing stays on this device.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Allow camera and continue" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Continue without camera" })).toBeEnabled();
  });
});
```

- [ ] **Step 3: Run the shell test and confirm failure**

Run: `npm test -- src/app/App.test.tsx`

Expected: FAIL because `App.tsx` and the test environment do not exist.

- [ ] **Step 4: Configure TypeScript, Vite, lint, formatting, and tests**

Configure Vite with `base: process.env.GITHUB_ACTIONS ? "/deep_work/" : "/"`, React, Tailwind, and Vitest `jsdom` setup. Configure strict TypeScript with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and project references. Import `@testing-library/jest-dom/vitest` in `src/test/setup.ts`.

- [ ] **Step 5: Implement the minimal real shell and visual tokens**

`App.tsx` must render the tested heading, privacy sentence, two buttons, and footer links for Privacy Policy and Terms of Use. `tokens.css` must define:

```css
:root {
  --paper: #e9e1d2;
  --paper-deep: #d7cdbd;
  --ink: #183042;
  --botanical: #3d5a40;
  --mineral: #756f65;
  --danger: #8a4b32;
  --radius: 2px;
  font-family: "IBM Plex Sans", sans-serif;
  color: var(--ink);
  background: var(--paper);
}
```

Use Newsreader only for headings and timer numerals. Use borders rather than shadows. Do not add emoji, icon packages, gradients, or animated hover effects.

- [ ] **Step 6: Run the complete bootstrap gate**

Run: `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build`

Expected: all commands PASS and `dist/index.html` exists.

- [ ] **Step 7: Commit the shell**

```bash
git add .nvmrc package.json package-lock.json index.html tsconfig*.json vite.config.ts eslint.config.mjs prettier.config.mjs src
git commit -m "feat: bootstrap Deep Work Companion shell"
```

### Task 2: Implement the pure session state machine

**Files:**
- Create: `src/session/session-types.ts`
- Create: `src/session/session-machine.ts`
- Create: `src/session/session-machine.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `SessionConfig`, `SessionState`, `SessionEvent`, `createSessionState(config, nowMs)`, `reduceSession(state, event)`, and `remainingMs(state, nowMs)`.

- [ ] **Step 1: Define the domain types in the failing test**

Test this exact public journey:

```ts
const config: SessionConfig = {
  cameraMode: "enabled",
  deckId: "sql-basics",
  durationMs: 25 * 60_000,
  goal: "Practice joins",
  preset: "balanced",
  sound: { enabled: true, volume: 0.4 },
  subject: "SQL",
};

let state = createSessionState(config, 1_000);
state = reduceSession(state, { type: "CONSENT_CAMERA" });
state = reduceSession(state, { type: "CAMERA_READY" });
state = reduceSession(state, { type: "CALIBRATION_READY" });
state = reduceSession(state, { type: "START", atMs: 2_000 });
state = reduceSession(state, {
  type: "AWARENESS_EVENT",
  atMs: 8_000,
  signal: "gaze-down",
});
expect(state.phase).toBe("gentle-reset");
expect(state.awarenessCount).toBe(1);
state = reduceSession(state, { type: "TAKING_NOTES", atMs: 9_000 });
expect(state.phase).toBe("notes-pause");
```

- [ ] **Step 2: Run the state-machine test and confirm failure**

Run: `npm test -- src/session/session-machine.test.ts`

Expected: FAIL because the session modules are missing.

- [ ] **Step 3: Implement explicit state and event unions**

Use these phase values: `welcome`, `consent`, `setup`, `calibration`, `focus`, `gentle-reset`, `quick-review`, `paused`, `notes-pause`, `break`, `reflection`, and `complete`.

```ts
export type PresetName = "gentle" | "balanced" | "strict";
export type Reflection = "yes" | "partly" | "not-yet";
export type CameraMode = "enabled" | "disabled";
```

Events must include `BEGIN_SETUP`, `CONSENT_CAMERA`, `DECLINE_CAMERA`, `CAMERA_READY`, `CAMERA_FAILED`, `CALIBRATION_READY`, `START`, `TICK`, `AWARENESS_EVENT`, `CONTINUE_STUDYING`, `OPEN_QUICK_REVIEW`, `COMPLETE_REVIEW`, `TAKING_NOTES`, `PAUSE`, `RESUME`, `BEGIN_BREAK`, `END_BREAK`, `PAGE_HIDDEN`, `PAGE_VISIBLE`, `END_SESSION`, `SUBMIT_REFLECTION`, and `RESET`.

Reject impossible events by returning the unchanged state. Store elapsed focus time as accumulated durations plus an active segment start, never as a decremented counter.

- [ ] **Step 4: Add timer, hidden-page, break, and sleep tests**

Cover these assertions:

```ts
expect(remainingMs(focusState, startMs + 60_000)).toBe(24 * 60_000);
expect(reduceSession(focusState, { type: "PAGE_HIDDEN", atMs: hiddenAt }).awarenessMode).toBe("paused-hidden");
expect(reduceSession(breakState, { type: "AWARENESS_EVENT", atMs: 5_000, signal: "face-absent" })).toEqual(breakState);
expect(reduceSession(sleptState, { type: "TICK", atMs: sleptAt + 3_600_000 }).requiresResumeConfirmation).toBe(true);
```

- [ ] **Step 5: Run domain tests**

Run: `npm test -- src/session/session-machine.test.ts`

Expected: PASS with every phase transition covered.

- [ ] **Step 6: Commit the session domain**

```bash
git add src/session
git commit -m "feat: add focus session state machine"
```

### Task 3: Implement the awareness policy and presets

**Files:**
- Create: `src/awareness/types.ts`
- Create: `src/awareness/presets.ts`
- Create: `src/awareness/awareness-policy.ts`
- Create: `src/awareness/awareness-policy.test.ts`

**Interfaces:**
- Consumes: `PresetName` from `src/session/session-types.ts`
- Produces: `VisionObservation`, `AwarenessSignal`, `AwarenessPolicyState`, `createAwarenessPolicy(preset)`, and `advanceAwareness(state, observation)`.

- [ ] **Step 1: Write a failing Balanced-preset dwell test**

```ts
const reliable = (capturedAtMs: number, gazeDownScore: number): VisionObservation => ({
  capturedAtMs,
  evidenceQuality: "reliable",
  faceCount: 1,
  gazeDownScore,
  headAwayScore: 0.1,
});

let policy = createAwarenessPolicy("balanced");
policy = advanceAwareness(policy, reliable(0, 0.9)).state;
const before = advanceAwareness(policy, reliable(4_999, 0.9));
expect(before.event).toBeNull();
const atThreshold = advanceAwareness(before.state, reliable(5_000, 0.9));
expect(atThreshold.event?.signal).toBe("gaze-down");
```

- [ ] **Step 2: Run the policy test and confirm failure**

Run: `npm test -- src/awareness/awareness-policy.test.ts`

Expected: FAIL because awareness modules are missing.

- [ ] **Step 3: Add exact immutable preset values**

```ts
export type VisionObservation = {
  capturedAtMs: number;
  evidenceQuality: "reliable" | "unreliable";
  faceCount: 0 | 1 | 2;
  gazeDownScore: number;
  headAwayScore: number;
};

export const PRESETS = {
  gentle: { awayMs: 10_000, absentMs: 20_000, recoveryMs: 2_000, cooldownMs: 60_000, notesPauseMs: 300_000 },
  balanced: { awayMs: 5_000, absentMs: 10_000, recoveryMs: 2_000, cooldownMs: 30_000, notesPauseMs: 300_000 },
  strict: { awayMs: 3_000, absentMs: 5_000, recoveryMs: 2_000, cooldownMs: 15_000, notesPauseMs: 180_000 },
} as const;
```

Use `0.7` as the entry score and `0.45` as the recovery score for gaze and head signals. Keep these score thresholds named and covered by tests so calibration can tune the score without changing dwell semantics.

- [ ] **Step 4: Implement dwell, hysteresis, recovery, and suppression**

`advanceAwareness` must:

- return no event for `evidenceQuality: "unreliable"`;
- return no event when `faceCount > 1`;
- require a prior reliable single-face observation before starting face-absence dwell;
- pick the longest-active qualifying signal deterministically;
- emit once, then require both cooldown expiry and 2 seconds of reliable recovery; and
- reset a signal's dwell when its score falls below the recovery score.

- [ ] **Step 5: Add table-driven edge-case tests**

Test all three presets, a 1ms transient, unreliable lighting, initial no-face state, multiple faces, cooldown spam, recovery, non-monotonic timestamps, and simultaneous gaze/head scores.

- [ ] **Step 6: Run the policy gate and commit**

Run: `npm test -- src/awareness && npm run typecheck`

Expected: PASS.

```bash
git add src/awareness src/session/session-types.ts
git commit -m "feat: add calibrated awareness policy"
```

### Task 4: Add versioned private storage, export, and deletion

**Files:**
- Create: `src/storage/types.ts`
- Create: `src/storage/repository.ts`
- Create: `src/storage/repository.test.ts`
- Create: `src/storage/export.ts`
- Create: `src/storage/export.test.ts`

**Interfaces:**
- Consumes: `SessionConfig` and reflection values from Task 2
- Produces: `SettingsRecord`, `SessionSummary`, `GardenState`, `ExportBundle`, `DeepWorkRepository`, `openDeepWorkRepository()`, `exportLocalData(repo)`, and `deleteLocalData(repo)`.

- [ ] **Step 1: Write the failing repository privacy test**

Use `fake-indexeddb/auto` and assert the only object stores are `settings`, `decks`, `sessions`, and `garden`.

```ts
const summary: SessionSummary = {
  awarenessCount: 2,
  completedAt: "2026-08-19T02:00:00.000Z",
  focusMs: 1_500_000,
  goal: "Practice joins",
  id: "session-1",
  reflection: "partly",
  reviewCorrect: 1,
  reviewTotal: 1,
  startedAt: "2026-08-19T01:30:00.000Z",
  subject: "SQL",
};
await repo.saveSession(summary);
expect(await repo.listSessions()).toEqual([summary]);
expect(JSON.stringify(await exportLocalData(repo))).not.toMatch(/landmark|bitmap|gazeScore|headPose/i);
```

- [ ] **Step 2: Run the storage test and confirm failure**

Run: `npm test -- src/storage/repository.test.ts`

Expected: FAIL because the storage adapter is missing.

- [ ] **Step 3: Implement the allowed record types and raw IndexedDB adapter**

Use these persistent settings and garden contracts:

```ts
export type SettingsRecord = {
  schemaVersion: 1;
  defaultDurationMs: number;
  defaultPreset: PresetName;
  soundEnabled: boolean;
  soundVolume: number;
  reducedMotion: "system" | "reduce" | "no-preference";
};

export type GardenState = {
  schemaVersion: 1;
  seedCount: number;
  completedSessions: number;
};
```

Define `DeepWorkRepository` exactly:

```ts
export interface DeepWorkRepository {
  getSettings(): Promise<SettingsRecord>;
  putSettings(value: SettingsRecord): Promise<void>;
  listSessions(): Promise<SessionSummary[]>;
  saveSession(value: SessionSummary): Promise<void>;
  listDeckRecords(): Promise<unknown[]>;
  putDeckRecord(id: string, value: unknown): Promise<void>;
  deleteDeckRecord(id: string): Promise<void>;
  getGarden(): Promise<GardenState>;
  putGarden(value: GardenState): Promise<void>;
  clear(): Promise<void>;
  close(): void;
}
```

Use database name `deep-work-companion`, schema version `1`, and explicit transaction completion promises. Sort sessions newest first.

- [ ] **Step 4: Implement export and comprehensive deletion**

`exportLocalData` returns `{ schemaVersion: 1, exportedAt, settings, decks, sessions, garden }`. `deleteLocalData` closes the database, calls `indexedDB.deleteDatabase`, deletes caches whose names start with `deep-work-`, removes application localStorage keys prefixed `deep-work:`, and returns a list of deleted categories.

- [ ] **Step 5: Test deletion and unavailable-storage fallback**

Assert that deletion removes all stores and owned caches. Inject a failing `IDBFactory` and verify the adapter exposes a typed `StorageUnavailableError` so the UI can continue with an in-memory repository.

- [ ] **Step 6: Run and commit**

Run: `npm test -- src/storage && npm run typecheck`

Expected: PASS.

```bash
git add src/storage package.json package-lock.json
git commit -m "feat: add private local progress storage"
```

### Task 5: Add local question decks and SQL sample content

**Files:**
- Create: `src/content/deck-schema.ts`
- Create: `src/content/deck-schema.test.ts`
- Create: `src/content/deck-service.ts`
- Create: `src/content/deck-service.test.ts`
- Create: `src/content/sql-sample.json`

**Interfaces:**
- Consumes: `DeepWorkRepository.listDeckRecords`, `putDeckRecord`, and `deleteDeckRecord`
- Produces: `QuestionDeck`, `Question`, `parseQuestionDeck(value)`, `DeckService`, and `createDeckService(repository)`.

- [ ] **Step 1: Write strict schema tests**

Use this exact contract:

```ts
export type Question = {
  id: string;
  prompt: string;
  choices: [string, string, ...string[]];
  correctChoice: number;
  explanation: string;
};

export type QuestionDeck = {
  schemaVersion: 1;
  id: string;
  title: string;
  subject: string;
  questions: Question[];
};
```

Tests must reject unknown keys, duplicate question IDs, an out-of-range `correctChoice`, fewer than two choices, empty normalized strings, more than 100 questions, and a serialized deck larger than 256 KiB.

- [ ] **Step 2: Run schema tests and confirm failure**

Run: `npm test -- src/content/deck-schema.test.ts`

Expected: FAIL because deck parsing is missing.

- [ ] **Step 3: Implement parser and service**

`DeckService` must provide `list()`, `get(id)`, `save(deck)`, `remove(id)`, `importJson(text)`, `exportJson(id)`, and `pickQuestion(deckId, excludedIds)`. Use `crypto.getRandomValues` for selection without creating a persistent behavioral profile.

- [ ] **Step 4: Add the SQL sample deck**

Create at least 10 original questions covering `SELECT`, filtering, `INNER JOIN`, `LEFT JOIN`, grouping, aggregate functions, `HAVING`, null handling, ordering, and parameterized-query safety. Each answer includes a concise explanation. Use ID `sql-basics` and subject `SQL`.

- [ ] **Step 5: Test round-trip import, export, and selection**

Assert deterministic selection with an injected random source, safe rejection messages, and JSON round trip. Assert the sample deck parses during the test.

- [ ] **Step 6: Run and commit**

Run: `npm test -- src/content && npm run typecheck`

Expected: PASS.

```bash
git add src/content
git commit -m "feat: add local study question decks"
```

### Task 6: Adapt the consent-safe camera lifecycle

**Files:**
- Create: `src/camera/session.ts`
- Create: `src/camera/session.test.ts`
- Create: `src/camera/use-camera-session.ts`
- Create: `src/camera/use-camera-session.test.tsx`
- Create: `docs/architecture/provenance.md`

**Interfaces:**
- Consumes: browser `MediaDevices`, `MediaStream`, `HTMLVideoElement`, and page visibility
- Produces: `CameraState`, `CameraRecoveryReason`, `CameraSnapshot`, `CameraSession`, and `useCameraSession(videoRef)`.

- [ ] **Step 1: Record provenance before adapting code**

Create `docs/architecture/provenance.md` with source repository, commit `4b78615bcc32eb9579fb39020df02ca59943ca09`, source paths `apps/web/src/camera/session.ts` and `apps/web/src/camera/useCameraSession.ts`, destination paths, adaptation purpose, and a statement that the repository owner authorized reuse.

- [ ] **Step 2: Write camera lifecycle tests first**

Cover consent before `getUserMedia`, 15-second ignored-prompt timeout, secure-context failure, denied permission, missing camera, busy camera, attach failure, track interruption, stale request disposal, restart, visibility stop, and `dispose()` stopping every owned track.

```ts
const session = new CameraSession(deps);
expect(session.snapshot.state).toBe("privacy-introduction");
expect(deps.getUserMedia).not.toHaveBeenCalled();
await session.start();
expect(session.snapshot.state).toBe("warm-up");
session.setVisibility(false);
expect(session.snapshot.reason).toBe("inactive-document");
expect(track.stop).toHaveBeenCalledOnce();
```

- [ ] **Step 3: Run the camera tests and confirm failure**

Run: `npm test -- src/camera`

Expected: FAIL because the camera session is missing.

- [ ] **Step 4: Adapt the exact owned Smart Smile camera session**

Read the two source files at the recorded commit, then adapt them with `apply_patch`. Keep the proven generation, abort, timeout, track-stop, warmup, and recovery behavior. Remove mobile camera switching from the public first-release UI, rename diagnostics from Smart Smile wording, and ensure `setVisibility(false)` stops analysis immediately.

- [ ] **Step 5: Add the React adapter and privacy assertions**

`useCameraSession` returns `{ snapshot, start, retry, stop, videoRef }`. It must not start in an effect. It starts only after the consent button invokes `start()`. Test that unmount stops tracks and that no frame or device label is written to storage.

- [ ] **Step 6: Run and commit**

Run: `npm test -- src/camera && npm run typecheck`

Expected: PASS.

```bash
git add src/camera docs/architecture/provenance.md
git commit -m "feat: add consent-safe camera lifecycle"
```

### Task 7: Vendor and verify the offline MediaPipe runtime

**Files:**
- Create: `scripts/vision-release.config.mjs`
- Create: `scripts/generate-vision-manifest.mjs`
- Create: `src/vision/manifest.ts`
- Create: `src/vision/manifest.test.ts`
- Create: `src/vision/integrity.ts`
- Create: `src/vision/integrity.test.ts`
- Create: `src/vision/generated/release-manifest.json`
- Create: `src/vision/release.ts`
- Create: `public/vision/mediapipe-0.10.35-face-landmarker-float16-v1/*`
- Create: `THIRD_PARTY_NOTICES.md`
- Modify: `docs/architecture/provenance.md`

**Interfaces:**
- Consumes: pinned `@mediapipe/tasks-vision@0.10.35` package files and official Face Landmarker `float16/1` model
- Produces: `VisionReleaseManifest`, `parseVisionManifest`, `verifyVisionResponse`, `VISION_MANIFEST`, and `VISION_MANIFEST_URL`.

- [ ] **Step 1: Add failing manifest and integrity tests**

Tests must require schema version `1`, runtime version `0.10.35`, model version `float16/1`, sorted unique paths, unique roles, same-origin public paths, exact byte counts, SHA-256 hashes, HTTPS sources, and required license references. Corrupted bytes must throw `VisionAssetError`.

- [ ] **Step 2: Run vision manifest tests and confirm failure**

Run: `npm test -- src/vision/manifest.test.ts src/vision/integrity.test.ts`

Expected: FAIL because manifest modules are missing.

- [ ] **Step 3: Adapt the owned release tooling and parser**

Read and adapt these source files from the recorded commit:

```text
apps/web/scripts/vision-release.config.mjs
apps/web/scripts/generate-vision-manifest.mjs
apps/web/src/vision/manifest.ts
apps/web/src/vision/integrity.ts
apps/web/src/vision/release.ts
apps/web/src/vision/generated/release-manifest.json
```

Remove the unused selfie-segmentation model and role. Keep Face Landmarker, SIMD and baseline WASM loaders and binaries, licenses, notices, and the three relevant model cards. Change absolute release paths to resolve through `resolveAppPath` for `/deep_work/`.

- [ ] **Step 4: Vendor the pinned assets and generate the manifest**

Use the adapted vendoring configuration to copy the exact runtime files from `node_modules/@mediapipe/tasks-vision`, fetch the official Face Landmarker model only from its recorded HTTPS source, and retain official notices. Generate the manifest twice and assert byte-for-byte deterministic output.

- [ ] **Step 5: Write third-party notices**

List MediaPipe Tasks Vision 0.10.35, Face Landmarker float16/1, WASM runtime files, their source URLs, licenses, model cards, and redistribution paths. Record every adapted Smart Smile vision file in provenance.

- [ ] **Step 6: Run the release integrity gate and commit**

Run: `npm run vision:manifest:check && npm test -- src/vision/manifest.test.ts src/vision/integrity.test.ts && npm run build`

Expected: PASS and the production build contains every manifest path.

```bash
git add scripts src/vision public/vision THIRD_PARTY_NOTICES.md docs/architecture/provenance.md
git commit -m "feat: vendor verified offline vision runtime"
```

### Task 8: Implement the worker protocol, calibration, and local observations

**Files:**
- Create: `src/vision/protocol.ts`
- Create: `src/vision/protocol.test.ts`
- Create: `src/vision/face-frame-pump.ts`
- Create: `src/vision/face-frame-pump.test.ts`
- Create: `src/vision/calibration.ts`
- Create: `src/vision/calibration.test.ts`
- Create: `src/vision/observation.ts`
- Create: `src/vision/observation.test.ts`
- Create: `src/vision/runtime-loader.ts`
- Create: `src/vision/worker-runtime.ts`
- Create: `src/vision/worker-runtime.test.ts`
- Create: `src/vision/worker.ts`
- Create: `src/vision/vision-client.ts`
- Create: `src/vision/vision-client.test.ts`
- Modify: `docs/architecture/provenance.md`

**Interfaces:**
- Consumes: `VISION_MANIFEST`, browser `ImageBitmap`, MediaPipe Face Landmarker, and camera generation
- Produces: validated `VisionWorkerCommand`, `VisionWorkerEvent`, `VisionClient`, and `VisionRuntimeSnapshot`; `OBSERVATION` events carry the Task 3 `VisionObservation` type.

- [ ] **Step 1: Define and test the strict worker protocol**

Commands are `PREPARE`, `START_CALIBRATION`, `FRAME`, `CANCEL`, and `DISPOSE`. Events are `PHASE`, `READY`, `CALIBRATION_PROGRESS`, `CALIBRATION_READY`, `OBSERVATION`, and `ERROR`. Import `VisionObservation` from `src/awareness/types.ts`; `OBSERVATION` carries only that exact payload:

```ts
type VisionObservationEvent = {
  type: "OBSERVATION";
  generation: number;
  sequence: number;
  observation: VisionObservation;
};

type VisionReason =
  | "first-use-offline"
  | "runtime-download-failed"
  | "runtime-integrity-failed"
  | "runtime-initialization-failed"
  | "runtime-cancelled"
  | "offline-cache-failed"
  | "calibration-insufficient";
```

Strict validators reject unknown keys, invalid generations, invalid timestamps, out-of-range scores, and malformed bitmaps. A malformed `FRAME` still closes any closeable bitmap property.

- [ ] **Step 2: Run protocol tests and confirm failure**

Run: `npm test -- src/vision/protocol.test.ts`

Expected: FAIL because the protocol is missing.

- [ ] **Step 3: Adapt bounded ImageBitmap transfer and runtime loading**

Adapt the owned `face-frame-pump.ts`, `runtime-loader.ts`, and `worker-runtime.ts` from the recorded commit. Preserve one-capture-at-a-time backpressure, 640px maximum input dimension, generation invalidation, SIMD fallback, integrity verification, and bitmap closing in every success, error, stale, malformed, and disposed path.

- [ ] **Step 4: Implement worker-local calibration**

For 3 seconds of reliable single-face frames, collect bounded samples of:

- left iris vertical ratio using landmarks 468, 159, and 145;
- right iris vertical ratio using landmarks 473, 386, and 374;
- head yaw and pitch derived from the facial transformation matrix; and
- face bounding-box size and position for evidence quality.

Use medians, reject non-finite samples, require at least 15 samples, and keep the resulting baseline only inside the active worker generation. `CANCEL` and `DISPOSE` erase it.

- [ ] **Step 5: Implement normalized observation scoring**

Map deviation from the calibration baseline into clamped 0 to 1 `gazeDownScore` and `headAwayScore`. Mark evidence unreliable for zero or multiple faces, poor landmark confidence, a face outside the accepted size or center range, or missing transformation data. Keep score mapping constants named and unit tested against synthetic numeric fixtures rather than face images.

- [ ] **Step 6: Implement VisionClient**

`VisionClient` exposes `prepare()`, `startCalibration()`, `submitFrame()`, `cancel()`, `dispose()`, `subscribe(listener)`, and an immutable `snapshot`. It transfers bitmap ownership with `worker.postMessage(command, [bitmap])`, ignores stale generations and sequences, retries preparation once, and reports typed recoverable failure codes.

```ts
export type VisionRuntimeSnapshot = {
  generation: number;
  phase: "idle" | "preparing" | "calibrating" | "ready" | "error";
  calibrationProgress: number;
  lastObservation: VisionObservation | null;
  errorCode: VisionReason | null;
};

export interface VisionClient {
  readonly snapshot: VisionRuntimeSnapshot;
  prepare(): Promise<void>;
  startCalibration(): void;
  submitFrame(bitmap: ImageBitmap, meta: { cameraGeneration: number; capturedAtMs: number; height: number; width: number }): boolean;
  cancel(): void;
  dispose(): void;
  subscribe(listener: (snapshot: VisionRuntimeSnapshot) => void): () => void;
}
```

- [ ] **Step 7: Run worker privacy and disposal tests**

Assert every bitmap is closed once, raw landmarks never appear in posted events, calibration is erased after cancel, out-of-order observations are dropped, and a failed inference posts one bounded error without an unhandled exception.

- [ ] **Step 8: Run and commit**

Run: `npm test -- src/vision && npm run typecheck && npm run vision:manifest:check`

Expected: PASS.

```bash
git add src/vision docs/architecture/provenance.md
git commit -m "feat: add private calibrated vision worker"
```

### Task 9: Compose the consent, setup, focus, and intervention journey

**Files:**
- Create: `src/app/hash-route.ts`
- Create: `src/app/hash-route.test.ts`
- Create: `src/app/use-session-controller.ts`
- Create: `src/app/use-session-controller.test.tsx`
- Create: `src/alerts/sound.ts`
- Create: `src/alerts/sound.test.ts`
- Create: `src/ui/screens/WelcomeScreen.tsx`
- Create: `src/ui/screens/SessionSetupScreen.tsx`
- Create: `src/ui/screens/CalibrationScreen.tsx`
- Create: `src/ui/screens/FocusScreen.tsx`
- Create: `src/ui/screens/QuickReviewScreen.tsx`
- Create: `src/ui/components/GentleResetDialog.tsx`
- Create: `src/ui/components/StaticSkeleton.tsx`
- Create: `src/ui/session-journey.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/ui/styles.css`

**Interfaces:**
- Consumes: session reducer, awareness policy, CameraSession, VisionClient, DeckService, and settings
- Produces: `useSessionController()`, accessible screens, `playAwarenessChime(options)`, and the usable camera or timer-only journey.

- [ ] **Step 1: Write the failing camera-free journey test**

```tsx
render(<App />);
await user.click(screen.getByRole("button", { name: "Continue without camera" }));
await user.type(screen.getByLabelText("Subject"), "SQL");
await user.type(screen.getByLabelText("Study goal"), "Practice joins");
await user.click(screen.getByRole("radio", { name: "25 minutes" }));
await user.click(screen.getByRole("button", { name: "Begin focus session" }));
expect(screen.getByRole("timer")).toHaveTextContent("25:00");
expect(screen.getByText("Camera awareness is off")).toBeInTheDocument();
```

- [ ] **Step 2: Write the failing awareness journey test**

Inject fake camera and vision adapters, complete calibration, emit Balanced observations at 0 and 5,000ms, and expect one dialog named `Your attention may have shifted`, one chime request, and one awareness count. Emit more events inside cooldown and assert no second dialog or sound.

- [ ] **Step 3: Run the journey tests and confirm failure**

Run: `npm test -- src/ui/session-journey.test.tsx`

Expected: FAIL because the journey screens and controller are missing.

- [ ] **Step 4: Implement the controller and screens**

Use one reducer state as the source of truth. The controller starts the camera only after consent, starts calibration only when the camera and vision runtime are ready, feeds observations into `advanceAwareness`, and dispatches at most one domain event for each emitted policy event.

Hide the camera preview after calibration. On page hide, stop the frame pump and camera, dispatch `PAGE_HIDDEN`, and display `Awareness paused - keep this window visible` when visible again until recovery succeeds.

- [ ] **Step 5: Implement sound with user activation and silent fallback**

Create a short two-tone Web Audio chime only after the student uses the sound-test or start button. Clamp volume from 0 to 1, close or reuse one `AudioContext`, do not fetch audio, and return `{ played: boolean, reason?: "disabled" | "blocked" }`. The visual dialog must work when `played` is false.

```ts
export type SoundOptions = { enabled: boolean; volume: number };
export type SoundResult = { played: true } | { played: false; reason: "disabled" | "blocked" };
export function playAwarenessChime(options: SoundOptions): Promise<SoundResult>;
```

- [ ] **Step 6: Implement Gentle Reset accessibility**

Use a native `<dialog>` when supported with an accessible fallback. Initial focus goes to `Continue studying`; Escape behaves like Continue; focus is restored to the Focus Stage; status copy is announced once; and the buttons are `Continue studying`, `Try a quick review`, and `I'm taking notes`.

- [ ] **Step 7: Add the approved static skeleton**

Show rectangular, non-animated loading blocks and a textual `Preparing private camera analysis` status. After the bounded load window, replace skeletons with Retry and Continue Without Camera actions.

- [ ] **Step 8: Run and commit**

Run: `npm test -- src/app src/alerts src/ui && npm run lint && npm run typecheck`

Expected: PASS.

```bash
git add src/app src/alerts src/ui
git commit -m "feat: add supportive focus session journey"
```

### Task 10: Add reflection, garden progress, decks, history, and data controls

**Files:**
- Create: `src/ui/screens/ReflectionScreen.tsx`
- Create: `src/ui/screens/HistoryScreen.tsx`
- Create: `src/ui/screens/DeckLibraryScreen.tsx`
- Create: `src/ui/screens/SettingsScreen.tsx`
- Create: `src/ui/components/BotanicalProgress.tsx`
- Create: `src/ui/progress-and-data.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/hash-route.ts`
- Modify: `src/app/use-session-controller.ts`
- Modify: `src/ui/styles.css`

**Interfaces:**
- Consumes: `DeepWorkRepository`, `DeckService`, completed session state, and `deleteLocalData`
- Produces: persisted `SessionSummary`, deterministic garden awards, deck CRUD UI, local JSON export, and comprehensive deletion UI.

- [ ] **Step 1: Write failing reflection and garden tests**

Complete a session, choose `Partly`, and assert that one summary is saved with facts only. Award one seed for any session with at least 60 seconds of focus and one additional seed for a completed quick review, capped at two seeds per session. Assert that no seed is removed after missed days.

- [ ] **Step 2: Write failing deck and deletion tests**

Import a valid deck, reject malformed JSON with a specific message, export the deck, then choose Delete My Data. Require typed confirmation text `DELETE LOCAL DATA`, clear every owned record and cache, return to Welcome, and announce completion.

- [ ] **Step 3: Run tests and confirm failure**

Run: `npm test -- src/ui/progress-and-data.test.tsx`

Expected: FAIL because the screens are missing.

- [ ] **Step 4: Implement Reflection Card and custom botanical progress**

Render focus time, awareness count, review totals, subject, goal, and Yes, Partly, Not yet choices. Draw the learning plant as original inline SVG with `role="img"` and a descriptive accessible name. Do not use emoji, icon packages, streaks, XP, leaderboards, or reward loss.

- [ ] **Step 5: Implement History, Deck Library, and Settings**

History lists newest-first local summaries and an empty state. Deck Library supports create, edit, remove, import, and export. Settings supports default duration, preset, sound, reduced-motion preference, export all data, reset defaults, and Delete My Data.

- [ ] **Step 6: Run and commit**

Run: `npm test -- src/ui src/storage src/content && npm run typecheck`

Expected: PASS.

```bash
git add src/app src/ui
git commit -m "feat: add local reflection and learning garden"
```

### Task 11: Add legal pages, offline caching, and GitHub Pages deployment

**Files:**
- Create: `LICENSE`
- Create: `docs/legal/privacy.md`
- Create: `docs/legal/terms.md`
- Create: `src/ui/screens/LegalScreen.tsx`
- Create: `src/ui/legal.test.tsx`
- Create: `src/service-worker/sw.ts`
- Create: `src/service-worker/client.ts`
- Create: `src/service-worker/vision-cache.ts`
- Create: `src/service-worker/vision-cache.test.ts`
- Create: `src/app/app-path.ts`
- Create: `src/app/app-path.test.ts`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/pages.yml`
- Modify: `vite.config.ts`
- Modify: `src/main.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/hash-route.ts`

**Interfaces:**
- Consumes: generated vision manifest, owned cache prefix, hash routes, and all production quality commands
- Produces: versioned legal content, registered service worker, verified offline runtime cache, `resolveAppPath(path)`, CI, and check-gated Pages deployment.

- [ ] **Step 1: Write failing legal-page tests**

Assert Privacy Policy and Terms of Use links exist on Welcome, Settings, and the footer. Privacy content must mention local frames, allowed stored categories, prohibited biometric storage, permissions, offline cache, export, deletion, no analytics, hidden-window behavior, and effective date. Terms must mention voluntary use, non-medical and non-disciplinary scope, false positives, no covert surveillance, minors, third-party notices, and warranty limits.

- [ ] **Step 2: Write failing base-path and offline-cache tests**

```ts
expect(resolveAppPath("vision/manifest.json", "/deep_work/")).toBe("/deep_work/vision/manifest.json");
expect(resolveAppPath("#/privacy", "/deep_work/")).toBe("/deep_work/#/privacy");
```

Test that the service worker verifies each manifest asset before marking the release ready, deletes a corrupt release, and never caches camera frames or IndexedDB exports.

- [ ] **Step 3: Run tests and confirm failure**

Run: `npm test -- src/ui/legal.test.tsx src/app/app-path.test.ts src/service-worker/vision-cache.test.ts`

Expected: FAIL because legal and service-worker modules are missing.

- [ ] **Step 4: Write the legal sources and render them in-app**

Create complete dated documents from design sections 8 and 12. Render the same versioned content in `LegalScreen` at `#/privacy` and `#/terms`. Use normal headings and paragraphs, not card grids or colored stripes.

- [ ] **Step 5: Adapt verified vision caching**

Adapt Smart Smile's owned `service-worker/vision-cache.ts`, `service-worker/sw.ts`, and `service-worker/client.ts` from the recorded commit. Rename cache and protocol prefixes to `deep-work`, preserve release locking, cancellation, inventory verification, corrupt-cache deletion, and safe response headers, and resolve every URL through the GitHub Pages base.

- [ ] **Step 6: Add CI and Pages workflows**

`ci.yml` runs `npm ci`, vision manifest check, format, lint, typecheck, unit tests, build, Playwright install, and E2E. `pages.yml` runs only after the same gates on `main`, uploads `dist`, and deploys with GitHub's official Pages actions. Grant only `contents: read`, `pages: write`, and `id-token: write` where required.

- [ ] **Step 7: Run the production and offline gate**

Run: `npm run vision:manifest:check && npm run build && npm test -- src/service-worker src/ui/legal.test.tsx src/app/app-path.test.ts`

Expected: PASS and `dist` contains legal routes, manifest, model, WASM, fonts, and service worker under the correct base.

- [ ] **Step 8: Commit**

```bash
git add LICENSE docs/legal src/service-worker src/ui/screens/LegalScreen.tsx src/ui/legal.test.tsx src/app .github vite.config.ts src/main.tsx
git commit -m "feat: add legal offline Pages delivery"
```

### Task 12: Prove the production journey and document validation

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/fixtures.ts`
- Create: `tests/e2e/camera-free.spec.ts`
- Create: `tests/e2e/awareness.spec.ts`
- Create: `tests/e2e/failures.spec.ts`
- Create: `tests/e2e/privacy.spec.ts`
- Create: `tests/e2e/offline.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `src/test/e2e-adapters.ts`
- Create: `src/test/e2e-adapters.test.ts`
- Create: `docs/validation/README.md`
- Create: `docs/validation/device-matrix.md`
- Create: `README.md`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: the complete production bundle and public UI contracts from Tasks 1 through 11
- Produces: reproducible browser evidence, accessibility checks, privacy assertions, device-validation instructions, and final project documentation.

- [ ] **Step 1: Configure tests against the exact production bundle**

Playwright must run `npm run build` once, serve `dist` at `/deep_work/`, and test desktop Chromium at 1440x900 and 1024x768. Do not test Vite dev-server behavior as release evidence.

- [ ] **Step 2: Add deterministic loopback-only test adapters**

The exact production bundle may accept injected camera and vision adapters only when both conditions are true: `location.hostname` is `127.0.0.1` or `localhost`, and `location.search` contains `e2e=1`. Playwright sets `window.__DEEP_WORK_E2E_ADAPTER__` with `page.addInitScript` before application startup. `src/test/e2e-adapters.ts` validates the injected object and returns real adapters for every non-loopback origin or missing flag. Fixtures emit protocol-valid observations and never bypass the awareness policy.

Unit-test `e2eAdaptersAllowed(location)` with loopback and GitHub Pages hostnames. The GitHub Pages case must return false even when `?e2e=1` and an injected global are present.

- [ ] **Step 3: Test the complete camera-free and awareness journeys**

Camera-free test: Welcome, decline camera, set SQL goal, run timer with fake clock, take a break, complete a review, reflect, inspect history, export, and delete.

Awareness test: consent, calibrate, run Balanced dwell, verify one sound request and Gentle Reset, suppress cooldown spam, choose notes pause, resume, hide page, confirm awareness pauses, show page, recover, and complete.

- [ ] **Step 4: Test every approved failure boundary**

Cover denied permission, ignored prompt, disconnected camera, worker preparation failure and one retry, runtime integrity failure, low-quality evidence, multiple faces, audio blocked, storage unavailable, device sleep, unsupported browser, and offline first use. Each assertion must verify whether the timer continues, whether awareness is paused, and which recovery action is offered.

- [ ] **Step 5: Add automated privacy and accessibility assertions**

Intercept all requests and fail if a request outside the application origin or an expected GitHub Pages document occurs. Inspect IndexedDB and Cache Storage after a session and assert prohibited key patterns and binary image values are absent. Run `@axe-core/playwright` on Welcome, Setup, Calibration, Focus, Gentle Reset, Reflection, History, Settings, Privacy, and Terms. Complete keyboard-only journeys and verify dialog focus restoration.

- [ ] **Step 6: Write manual device validation**

`device-matrix.md` contains rows for Chrome Windows, Edge Windows, Chrome macOS, and Edge macOS. Each row records browser version, OS version, camera type, permission flows, calibration, each signal, each preset, multiple faces, hidden window, sleep, sound mute, low performance, install, and offline restart. Use `Not run` as the initial evidence status, which is a factual state rather than a placeholder.

- [ ] **Step 7: Execute the supported-device and performance matrix**

On each available supported environment, record the exact OS, browser, camera, calibration sample count, model-ready time, median observation interval, timer responsiveness, alert timing for all three presets, false-positive notes, install result, and offline restart result. Mark an unavailable environment `Blocked - device unavailable` with the date and owner rather than claiming support. The final review gate remains blocked until all four supported browser and OS rows pass.

- [ ] **Step 8: Write the README and real demonstration path**

Document purpose, supported boundary, privacy, visible-window requirement, installation, development, all quality commands, local deck format, live Pages URL pattern, camera-free exploration, real camera demonstration, architecture, provenance, licenses, legal pages, validation evidence, and known limitations. Credit the McDonald's project only as inspiration and link the Smart Smile provenance record.

- [ ] **Step 9: Run the full release gate**

Run:

```bash
npm run vision:manifest:check
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
git diff --check
```

Expected: every command PASS, no uncommitted generated-manifest change, no external runtime request, and one screenshot artifact for each named viewport and major journey.

- [ ] **Step 10: Commit release evidence and documentation**

```bash
git add playwright.config.ts tests src/test/e2e-adapters.ts src/test/e2e-adapters.test.ts docs/validation README.md package.json package-lock.json
git commit -m "test: prove Deep Work Companion release"
```

## Final review gate

After Task 12, compare the completed application against every numbered acceptance criterion in `docs/superpowers/specs/2026-08-19-deep-work-companion-design.md`. Record each criterion as Passed or Blocked with an exact test, command, or device-matrix reference. Do not deploy or claim completion while any criterion is Blocked.
