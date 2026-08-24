# Task 1 Report: Map a core timer session to a Plaza outcome

## Status

Implemented and verified the pure `SessionState` → `PlazaSessionOutcome` adapter.

## Changes

- Added `src/plaza/core-session-outcome.ts` with the exported `plazaOutcomeFromCoreSession` function.
- Added `src/plaza/core-session-outcome.test.ts` covering:
  - completed timer mapping with stable Plaza fields;
  - rejection of terminal states without a stable core session identifier;
  - early-ended timer mapping to Plaza's `incomplete` status.
- Missing `sessionId`, start timestamp, finish timestamp, or finish reason returns `null`, preventing a reward record for missing/legacy terminal sessions.
- Reused the existing Plaza schema and mapped core `ended` to Plaza `incomplete` without changing Course Guard behavior.

## TDD evidence

1. Wrote the adapter tests first.
2. Ran the focused test and confirmed the expected module-resolution failure because the adapter did not exist.
3. Implemented the minimal adapter.
4. Ran the focused test successfully.

## Verification

- Focused test: `3 passed`
- Full test suite: `43 files passed, 168 tests passed`
- Typecheck: passed
- Lint: passed
- Format check: passed
- `git diff --check`: passed

## Self-review

The change is isolated to the new adapter and its tests. It does not modify App integration, UI, styling, persistence, Plaza contracts, Course Guard code, or dependencies.

## Commit

Recorded in the task commit produced after this report was written.
