# Momo Memory Garden Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Replace the old editorial Learning Garden/history surface with one original, accessible Momo toy-town archive everywhere it appears.

**Architecture:** Extract the inline ProgressShelf from App into a presentation-only MomoMemoryGarden backed by the current RepositorySnapshot and action callbacks. MomoSproutPlanter owns the original SVG and garden facts, while HistoryScreen gains an explicit heading option so unchanged session facts render as a Quest Log. Every new visual rule remains below the archive root.

**Tech Stack:** React 18, TypeScript, CSS custom properties, Vitest, Testing Library, Playwright, existing IndexedDB repository.

## Global Constraints

- Reuse the existing garden, summaries, export, and delete flows; do not change persistence schemas, routes, reward calculations, or game currencies.
- Use an original inline Momo sprout-planter SVG with role="img" and a descriptive accessible name. Do not use emoji as meaningful visual content, third-party images, remote assets, logos, or new dependencies.
- Render the same archive after a reward and from More study tools.
- Retain current private-history facts, reverse chronological ordering, export control, deletion wording, typed deletion confirmation, visible focus, and device-local privacy behavior.
- Scope Momo styling below .momo-memory-garden; do not globally restyle generic history, garden, data-action, legal, or form classes.
- At 390px, the archive must have no horizontal overflow, remain keyboard reachable, and respect prefers-reduced-motion.

---

## File Structure

- src/ui/components/MomoSproutPlanter.tsx — original inline SVG garden mark and derived seed/session/stage facts.
- src/ui/components/MomoSproutPlanter.test.tsx — verifies the SVG accessible name and progress facts.
- src/ui/screens/MomoMemoryGarden.tsx — shared archive presentation, collected-sprout badges, Quest Log, and data controls.
- src/ui/momo-memory-garden.test.tsx — verifies archive semantics, callback actions, history facts, and private copy.
- src/ui/screens/HistoryScreen.tsx — allows a caller-provided heading while retaining existing formatters and reverse ordering.
- src/app/App.tsx — removes inline ProgressShelf and renders MomoMemoryGarden in both current locations.
- src/ui/progress-and-data.test.tsx — preserves storage/deletion coverage under the Momo surface.
- src/ui/styles.css — adds root-scoped desktop, mobile, focus, and reduced-motion styles; removes unused progress-shelf rules.
- tests/e2e/plaza.spec.ts — proves reward-to-archive and narrow-viewport access.

### Task 1: Create the original Momo sprout-planter mark

**Files:**
- Create: src/ui/components/MomoSproutPlanter.tsx
- Create: src/ui/components/MomoSproutPlanter.test.tsx

**Interfaces:**
- Consumes: GardenState from src/garden/garden.ts.
- Produces: MomoSproutPlanter({ garden }: { garden: GardenState }): JSX.Element.
- Used by: MomoMemoryGarden in Task 2.

- [ ] **Step 1: Write the failing sprout-planter test**

~~~tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MomoSproutPlanter } from "./MomoSproutPlanter";

describe("MomoSproutPlanter", () => {
  it("describes original Momo garden progress without an emoji marker", () => {
    render(
      <MomoSproutPlanter
        garden={{
          plants: [{
            createdAtMs: 1_000, growth: 2, seeds: 2, sessionId: "session-1",
            stage: "leaf", subject: "SQL",
          }],
          schemaVersion: 1,
          totalSeeds: 2,
        }}
      />,
    );

    expect(
      screen.getByRole("img", { name: /momo sprout planter.*2 permanent seeds/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 seeds")).toBeInTheDocument();
    expect(screen.getByText("1 session recorded")).toBeInTheDocument();
    expect(screen.getByText("Latest stage: leaf")).toBeInTheDocument();
  });
});
~~~

- [ ] **Step 2: Run the focused test to confirm the missing module fails**

Run: npm test -- src/ui/components/MomoSproutPlanter.test.tsx

Expected: FAIL with a module-resolution error for ./MomoSproutPlanter.

- [ ] **Step 3: Implement the isolated SVG component**

~~~tsx
import type { GardenState } from "../../garden/garden";

type MomoSproutPlanterProps = { garden: GardenState };

export function MomoSproutPlanter({ garden }: MomoSproutPlanterProps) {
  const totalSeeds =
    garden.totalSeeds ?? garden.plants.reduce((sum, plant) => sum + plant.seeds, 0);
  const latestStage = garden.plants.at(-1)?.stage ?? "sprout";
  const sessionCount = garden.plants.length;

  return (
    <section className="momo-sprout-planter" aria-labelledby="momo-sprout-progress-title">
      <svg
        role="img"
        aria-label={["Momo sprout planter, ", totalSeeds, " permanent seeds"].join("")}
        viewBox="0 0 220 205"
      >
        <path className="momo-sprout-leaf" d="M108 57C83 21 45 27 45 54c32 4 50 24 63 48" />
        <path className="momo-sprout-leaf" d="M116 58c27-37 65-28 63 0-29 7-48 27-60 48" />
        <path className="momo-sprout-planter-pot" d="M55 125h110l-12 55H67z" />
        <circle className="momo-sprout-body" cx="110" cy="117" r="47" />
        <ellipse className="momo-sprout-face" cx="110" cy="127" rx="29" ry="22" />
        <circle cx="98" cy="125" r="4" />
        <circle cx="122" cy="125" r="4" />
        <path className="momo-sprout-smile" d="M103 138q7 7 14 0" />
      </svg>
      <div className="momo-sprout-copy">
        <p id="momo-sprout-progress-title">Garden keepsake</p>
        <strong>{totalSeeds} seeds</strong>
        <span>{sessionCount} {sessionCount === 1 ? "session" : "sessions"} recorded</span>
        <span>Latest stage: {latestStage}</span>
      </div>
    </section>
  );
}
~~~

Use only the existing Momo palette custom properties in CSS; every SVG path has a navy stroke and none of the rendered text is an emoji.

- [ ] **Step 4: Run the focused component test**

Run: npm test -- src/ui/components/MomoSproutPlanter.test.tsx

Expected: PASS with one named SVG image and all dynamic facts present.

- [ ] **Step 5: Commit the custom visual unit**

~~~bash
git add src/ui/components/MomoSproutPlanter.tsx src/ui/components/MomoSproutPlanter.test.tsx
git commit -m "feat: add Momo sprout planter"
~~~

### Task 2: Build one reusable Momo Memory Garden and connect both surfaces

**Files:**
- Create: src/ui/screens/MomoMemoryGarden.tsx
- Create: src/ui/momo-memory-garden.test.tsx
- Modify: src/ui/screens/HistoryScreen.tsx
- Modify: src/app/App.tsx
- Modify: src/ui/progress-and-data.test.tsx
- Delete: src/ui/components/BotanicalProgress.tsx

**Interfaces:**
- Consumes: RepositorySnapshot, MomoSproutPlanter, HistoryScreen, and onExport/onDelete callbacks.
- Produces: MomoMemoryGarden({ snapshot, onExport, onDelete }: MomoMemoryGardenProps).
- Used by: setup's More study tools and the reflected-session reward route.

- [ ] **Step 1: Write the failing shared-archive test**

~~~tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialPlazaState } from "../plaza/plaza-machine";
import { MomoMemoryGarden } from "./screens/MomoMemoryGarden";

describe("MomoMemoryGarden", () => {
  it("renders Momo's archive, private Quest Log, and safe data controls", () => {
    const onExport = vi.fn();
    const onDelete = vi.fn();

    render(
      <MomoMemoryGarden
        onDelete={onDelete}
        onExport={onExport}
        snapshot={{
          active: null,
          decks: [],
          garden: {
            plants: [{
              createdAtMs: 61_000, growth: 2, seeds: 1, sessionId: "core-1",
              stage: "leaf", subject: "SQL",
            }],
            schemaVersion: 1,
            totalSeeds: 1,
          },
          plaza: createInitialPlazaState(),
          preferences: { durationMs: 1_500_000, selectedDeckId: null, sound: "silent" },
          schemaVersion: 1,
          summaries: [{
            awarenessCount: 0, durationMs: 1_500_000, elapsedMs: 60_000,
            finishedAtMs: 61_000, finishReason: "ended", goal: "Review joins",
            reflection: "yes", schemaVersion: 1, sessionId: "core-1",
            startedAtMs: 1_000, subject: "SQL",
          }],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Momo's Memory Garden" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quest Log" })).toBeInTheDocument();
    expect(screen.getByText(/Only subjects, goals, timing, reflections, and session status/i)).toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Export my data" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete my data" }));
    expect(onExport).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
~~~

- [ ] **Step 2: Run the focused archive test to verify it fails**

Run: npm test -- src/ui/momo-memory-garden.test.tsx

Expected: FAIL with a module-resolution error for ./screens/MomoMemoryGarden.

- [ ] **Step 3: Make HistoryScreen caller-configurable without changing its facts**

~~~tsx
type HistoryScreenProps = {
  summaries: SessionSummary[];
  title?: string;
};

export function HistoryScreen({ summaries, title = "Session history" }: HistoryScreenProps) {
  return (
    <div className="history-panel" aria-labelledby="history-title">
      <div className="history-heading">
        <h3 id="history-title">{title}</h3>
        <p>Only subjects, goals, timing, reflections, and session status are kept here.</p>
      </div>
      {summaries.length > 0 ? (
        <ol className="history-list">
          {[...summaries].reverse().map((summary) => (
            <li key={summary.sessionId}>
              <div className="history-main">
                <strong>{summary.subject}</strong>
                <span>{summary.goal}</span>
              </div>
              <div className="history-meta">
                <span>{summary.finishReason === "completed" ? "Completed" : "Ended early"}</span>
                <span>{formatDuration(summary.elapsedMs)}</span>
                {summary.reflection && <span>Reflection: {reflectionLabel(summary.reflection)}</span>}
                {summary.quickReviewCompleted && <span>Quick Review completed</span>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-progress">Complete a session to add its summary here.</p>
      )}
    </div>
  );
}
~~~

- [ ] **Step 4: Implement the shared archive and swap App callers**

~~~tsx
import type { RepositorySnapshot } from "../../storage/repository";
import { MomoSproutPlanter } from "../components/MomoSproutPlanter";
import { HistoryScreen } from "./HistoryScreen";

export type MomoMemoryGardenProps = {
  onDelete: () => void;
  onExport: () => void;
  snapshot: RepositorySnapshot;
};

export function MomoMemoryGarden({ onDelete, onExport, snapshot }: MomoMemoryGardenProps) {
  const sproutCount = snapshot.garden.plants.length;

  return (
    <section className="momo-memory-garden" aria-labelledby="momo-memory-garden-title">
      <header className="momo-memory-garden-header">
        <div>
          <p className="momo-memory-garden-kicker">Private keepsakes</p>
          <h2 id="momo-memory-garden-title">Momo&apos;s Memory Garden</h2>
          <p>Your private keepsakes from growing focus habits.</p>
        </div>
        <span className="momo-sprout-count">
          {sproutCount} sprout{sproutCount === 1 ? "" : "s"}
        </span>
      </header>
      <div className="momo-memory-garden-grid">
        <MomoSproutPlanter garden={snapshot.garden} />
        <section className="momo-collected-sprouts" aria-labelledby="momo-collected-sprouts-title">
          <h3 id="momo-collected-sprouts-title">Collected sprouts</h3>
          {snapshot.garden.plants.length > 0 ? (
            <ul className="momo-collected-sprout-list">
              {snapshot.garden.plants.map((plant) => (
                <li key={plant.sessionId}>
                  <span className={`momo-collected-sprout-stage momo-collected-sprout-stage-${plant.stage}`}>
                    {plant.stage === "bloom" ? "Bloom" : plant.stage === "leaf" ? "Leaf" : "Sprout"}
                  </span>
                  <span>{plant.subject}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="momo-empty-progress">No completed sessions yet.</p>
          )}
        </section>
      </div>
      <HistoryScreen summaries={snapshot.summaries} title="Quest Log" />
      <div className="momo-device-keepsakes" aria-label="Device keepsakes controls">
        <button className="momo-export-button" type="button" onClick={onExport}>Export my data</button>
        <button className="momo-delete-button" type="button" onClick={onDelete}>Delete my data</button>
      </div>
    </section>
  );
}
~~~

In App.tsx remove the inline ProgressShelf, BotanicalProgress and HistoryScreen imports, and the gardenStageLabel helper that only served the inline shelf. Import MomoMemoryGarden and use the same props at both former ProgressShelf call sites. Delete BotanicalProgress.tsx only after confirming no production import remains.

- [ ] **Step 5: Update existing storage/deletion expectations and run focused tests**

Change the existing image assertion from Learning Garden botanical progress to Momo sprout planter. Keep the More study tools action, typed DELETE LOCAL DATA confirmation, status announcement, and repository assertions unchanged.

Run:
~~~bash
npm test -- src/ui/components/MomoSproutPlanter.test.tsx src/ui/momo-memory-garden.test.tsx src/ui/progress-and-data.test.tsx
~~~

Expected: PASS, including both action callbacks and the complete local deletion flow.

- [ ] **Step 6: Commit the shared surface**

~~~bash
git add src/app/App.tsx src/ui/screens/MomoMemoryGarden.tsx src/ui/screens/HistoryScreen.tsx
git add src/ui/momo-memory-garden.test.tsx src/ui/progress-and-data.test.tsx
git add src/ui/components/MomoSproutPlanter.tsx src/ui/components/MomoSproutPlanter.test.tsx
git rm src/ui/components/BotanicalProgress.tsx
git commit -m "feat: unify progress as Momo Memory Garden"
~~~

### Task 3: Apply scoped Momo town styling and prove the browser journey

**Files:**
- Modify: src/ui/styles.css
- Modify: tests/e2e/plaza.spec.ts

**Interfaces:**
- Consumes: semantic class names emitted by MomoMemoryGarden, MomoSproutPlanter, and SessionRewardScreen.
- Produces: a two-column desktop archive, one-column 390px archive, clear focus styles, and no old editorial panel in the post-reflection journey.

- [ ] **Step 1: Extend the browser test to fail on the old archive**

Add these checks immediately after the existing Momo reward heading assertion:

~~~ts
await expect(page.getByRole("heading", { name: "Momo's Memory Garden" })).toBeVisible();
await expect(page.getByRole("img", { name: /Momo sprout planter/i })).toBeVisible();
await expect(page.getByRole("heading", { name: "Learning Garden", exact: true })).toHaveCount(0);
await expect(page.getByRole("heading", { name: "Quest Log" })).toBeVisible();
await expect(page.locator(".momo-memory-garden")).toHaveCSS("border-top-width", "4px");
~~~

Add a second browser test that loads /, opens More study tools, and asserts Momo's Memory Garden. At 390 by 844, use Tab to focus Export my data, assert a solid outline, and assert document.documentElement.scrollWidth is less than or equal to document.documentElement.clientWidth.

- [ ] **Step 2: Run the focused browser file to verify the new expectations fail**

Run: npx playwright test --config=tests/e2e tests/e2e/plaza.spec.ts

Expected: FAIL because the Momo archive markup and styles are not yet complete.

- [ ] **Step 3: Add root-scoped game-world CSS**

~~~css
.momo-memory-garden {
  width: min(1120px, calc(100% - 32px));
  margin: 32px auto 0;
  overflow: clip;
  border: 4px solid var(--momo-ink);
  border-radius: 28px;
  background: var(--momo-cream);
  box-shadow: 8px 8px 0 var(--momo-shadow);
  color: var(--momo-ink);
  font-family: "Arial Rounded MT Bold", "Trebuchet MS", "IBM Plex Sans", sans-serif;
}

.momo-memory-garden-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 26px;
  border-bottom: 4px solid var(--momo-ink);
  background: var(--momo-leaf);
}

.momo-memory-garden-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 18px;
  padding: 22px;
}

.momo-memory-garden button:focus-visible {
  outline: 3px solid var(--momo-ink);
  outline-offset: 4px;
}

@media (max-width: 540px) {
  .momo-memory-garden { width: min(100% - 24px, 560px); }
  .momo-memory-garden-grid { grid-template-columns: 1fr; padding: 14px; }
}
~~~

Add these remaining scoped rules after the block above:

~~~css
.momo-memory-garden .momo-sprout-planter,
.momo-memory-garden .momo-collected-sprouts,
.momo-memory-garden .history-panel {
  border: 3px solid var(--momo-ink);
  border-radius: 18px;
  background: #fffdf5;
}

.momo-memory-garden .history-panel { border-radius: 0; border-width: 3px 0 0; }
.momo-memory-garden .momo-collected-sprout-stage { border: 2px solid var(--momo-ink); border-radius: 8px; background: var(--momo-pink); }
.momo-memory-garden .momo-export-button { border: 3px solid var(--momo-ink); border-radius: 12px; background: var(--momo-lemon); color: var(--momo-ink); }
.momo-memory-garden .momo-delete-button { border: 0; background: transparent; color: #9b4534; text-decoration: underline; }
~~~

Remove obsolete progress-shelf, progress-header, garden-count, garden-list, and matching mobile-only rules after confirming no component emits them. Do not affect HistoryScreen outside the new root.

- [ ] **Step 4: Run the focused browser test and inspect both viewport states**

Run: npx playwright test --config=tests/e2e tests/e2e/plaza.spec.ts

Expected: PASS with reward archive, More study tools archive, visible keyboard focus, and no 390px horizontal overflow.

- [ ] **Step 5: Commit the visual system and journey coverage**

~~~bash
git add src/ui/styles.css tests/e2e/plaza.spec.ts
git commit -m "style: theme memory garden for Momo Plaza"
~~~

### Task 4: Validate the complete project contract

**Files:**
- Verify only: current feature diff and all test/build outputs.

**Interfaces:**
- Consumes: all completed feature tasks.
- Produces: evidence that the archive has no schema, extension, build, accessibility, or responsive regression.

- [ ] **Step 1: Run static and unit validation**

Run:
~~~bash
npm run format:check
npm run lint
npm run typecheck
npm test
~~~

Expected: each exits 0; tests cover the original SVG, archive actions, preserved deletion behavior, and Momo route.

- [ ] **Step 2: Run production, extension, and manifest validation**

Run:
~~~bash
npm run build
npm run extension:build
npm run vision:manifest:check
~~~

Expected: each exits 0 with no dependency or manifest regression.

- [ ] **Step 3: Run the full browser suite and diff checks**

Run:
~~~bash
npx playwright test --config=tests/e2e
git diff --check origin/main...HEAD
git status --short --branch
~~~

Expected: browser suite passes; git diff --check has no output; status reports only the committed feature branch with no working-tree changes.

- [ ] **Step 4: Record the validation outcome without an empty commit**

If any validation command fails, fix its specific cause in the relevant task, rerun that command, and commit the corrected source/test files with that task's commit message. If all commands pass and the worktree is clean, do not create an empty validation commit.
