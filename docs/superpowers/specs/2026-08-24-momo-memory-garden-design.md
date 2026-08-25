# Momo Memory Garden Design

## Goal

Make the private progress and history area feel like a continuous part of Momo's toy-town world. After a focus reward, the page must continue into a Momo-styled archive rather than reverting to the earlier editorial Learning Garden treatment. The same archive must appear from More study tools.

## User-approved direction

Use the shared Momo archive direction:

- The visual name is **Momo's Memory Garden**.
- The garden marker is an original **Momo sprout planter** SVG: a pink Momo face in a lemon planter with two green leaves and the existing thick Momo outline. It is not an emoji, a copied character asset, or a third-party image.
- Existing session, garden, privacy, export, and deletion data stays device-local and keeps its current behavior.

## Scope

### Shared presentation component

Extract the current `ProgressShelf` from `App.tsx` into a presentation component such as `MomoMemoryGarden`. It receives the existing `RepositorySnapshot`, `onExport`, and `onDelete` callbacks and is rendered in both current locations:

1. Below `SessionRewardScreen` after reflection.
2. In the More study tools surface.

The component must be presentation-only: no new persistence, routes, reward calculations, or state schema.

### Archive structure

The shared panel contains these regions, in order:

1. **Momo's Memory Garden header** — a leaf-green town card header, device-local progress description, and existing plant-count fact expressed as a compact sprout badge.
2. **Garden keepsake** — the original Momo sprout planter SVG plus current permanent seed total, session count, and latest stage. The image exposes a descriptive accessible name containing the seed total; emoji must not be used as meaningful content.
3. **Collected sprouts** — current garden plant entries stay available, but their stage labels become rounded Momo-style badges. The empty state stays clear and truthful.
4. **Quest Log** — the existing `HistoryScreen` information (subject, goal, timing, reflection, session status) remains in reverse chronological order and preserves its privacy explanation. It receives a Momo visual treatment and heading, without changing stored data or hiding facts.
5. **Device keepsakes controls** — existing export and delete callbacks remain available with their accessible names and destructive-confirmation flow. Export is a game-styled secondary control; delete remains visually distinct and never looks like a reward or primary action.

## Visual system

- Reuse the existing `--momo-*` tokens, rounded display type stack, 3–4px navy outlines, cream panel interiors, green header, lemon action treatment, pink accent badges, and offset navy shadows.
- Scope all new rules below a dedicated `.momo-memory-garden` root. Do not globally restyle the garden, history, data-action, legal, or generic form classes.
- The garden and Quest Log use a two-column arrangement where space allows, becoming a single-column stack at narrow widths. Controls remain keyboard reachable and no horizontal overflow is allowed at 390px.
- Keep `prefers-reduced-motion` safe. The sprout mark is static; any optional hover lift is disabled under reduced motion.

## Accessibility and safety

- Keep semantic section, heading, ordered-history list, button, and dialog structure.
- Give the custom SVG an explicit `role="img"` and descriptive accessible name; avoid emoji-only labels.
- Preserve existing `Export my data`, `Delete my data`, `Delete all local data`, and typed confirmation behavior so automation and keyboard users retain known paths.
- Maintain visible focus styles for the export/delete actions; the delete control keeps a clear destructive color and is never adjacent to a misleading reward button.

## Non-goals

- No new routes, game currencies, garden progression rules, cosmetic unlocks, remote assets, dependencies, accounts, or persistence schema changes.
- No changes to the Momo reward calculation or exactly-once core-session integration.
- No redesign of unrelated settings, Course Guard, legal pages, or the Plaza dashboard.

## Verification

- Update component/unit coverage to prove the Momo Memory Garden heading, original sprout accessible label, garden facts, Quest Log privacy copy, export control, and deletion flow.
- Extend the post-reflection browser journey to verify the old editorial `Learning Garden` heading is absent and the Momo archive remains reachable after the reward; add a narrow viewport assertion for no horizontal overflow and keyboard focus.
- Run formatting, lint, typecheck, unit tests, production and extension builds, vision-manifest validation, E2E, and `git diff --check`.
