# Momo Session Reward Screen

## Purpose

Make the ordinary Deep Work session-complete screen feel like part of Momo's Plaza. A
student who reflects on a finished timer should see their learning acknowledged by Momo
and return naturally to the game dashboard.

## Scope

This changes the terminal `complete` phase of the core timer flow. It does not change
the timer, reflection questions, archive, export, privacy behavior, Course Guard
extension protocol, or reward thresholds.

## Experience

After a student selects a reflection, the app presents a Momo reward screen instead of
the editorial completion card.

- The page uses the existing toy-town palette, HUD treatment, thick outlined cards, and
  original CSS Momo illustration.
- The hero states that the focus session is complete, shows the subject, goal, and
  reflection, and presents Momo in the `proud` mood.
- A reward card states the growth earned from that session and shows the next cosmetic
  unlock (or that all rewards are available).
- The primary action is **Back to Momo's Plaza**. It resets the completed core-session
  state and navigates to `#/plaza` so the updated HUD, quest, and recent-learning list
  are immediately visible.
- Existing device-local saving copy remains available in concise supporting text.

## Game-state behavior

On the first transition from `reflection` to `complete`, the app creates a Plaza
session outcome from the core session:

- `id` is the core `sessionId`.
- `courseLabel` is the session subject; `courseOrigin` is the local Deep Work app.
- Start, finish, elapsed time, and completion status come from the timer state.
- The existing `SESSION_COMPLETED` or `SESSION_ENDED` reducer event applies the
  established reward rules: focused minutes award growth, a completed 25-minute
  session can award the Sun sticker, Momo becomes proud, and energy is bounded.

The existing Plaza reducer replaces records with the same ID. The app must emit the
terminal event only for this reflection transition, never while merely rendering the
completion screen. Reloading the page therefore cannot award the same session twice.

## Architecture

- Add a focused `SessionRewardScreen` UI component with explicit props for the core
  summary, companion, earned reward, next unlock, storage availability, and the return
  action. It renders no persistence or routing logic itself.
- In `App`, derive the core-session outcome and dispatch the existing Plaza reducer in
  `chooseReflection` before/alongside the core reflection state transition. Reuse the
  Plaza state persistence effect; do not introduce a second store or a schema change.
- Reuse `FocusFriend`, `PlazaGameHud`, `nextUnlock`, and existing reward definitions.
- Add only scoped CSS under the new reward-screen classes. Respect
  `prefers-reduced-motion`; use no third-party assets or Tamagotchi branding.

## Edge cases and accessibility

- Early-ended sessions use the existing `SESSION_ENDED` reward behavior and remain
  visibly acknowledged without pretending that the planned duration was completed.
- Missing or legacy `sessionId` values do not create a reward record; the reward screen
  still renders safely.
- The reward screen has one descriptive `h1`, semantic reward/status text, a visible
  keyboard focus state, and a clearly named primary button.
- If all cosmetics are unlocked, show the existing complete-Plaza message instead of a
  nonexistent next unlock.

## Verification

- App tests prove that reflecting once creates exactly one persisted Plaza record and
  that a reload does not increase its growth again.
- Component tests cover session details, earned growth, unlocked/next-unlock messaging,
  and the Plaza return action.
- A Playwright journey covers timer completion or early end, reflection, reward screen,
  and return to `#/plaza` at desktop and a narrow mobile viewport.
- Run format, lint, typecheck, unit tests, build, extension build, manifest validation,
  and browser tests before proposing the change for review.

## Acceptance criteria

1. The old editorial `Session complete` card no longer renders after a core-session
   reflection.
2. The new terminal screen visually belongs to Momo's Plaza and preserves the session
   subject, goal, reflection, and saving status.
3. One reflected core session updates Momo's persisted growth exactly once.
4. **Back to Momo's Plaza** returns to `#/plaza`, where the reward is visible in the HUD
   and recent-learning list.
5. The existing Course Guard game loop and all existing session history behavior remain
   intact.
