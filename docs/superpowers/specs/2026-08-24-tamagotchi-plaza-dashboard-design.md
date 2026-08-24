# Tamagotchi Plaza Learning Dashboard

**Date:** 2026-08-24
**Status:** Design proposal — awaiting user review

## Summary

Turn Learning Plaza into a colorful, character-centered study dashboard inspired by the town-and-shop structure of Tamagotchi Plaza. The product remains a focused learning tool: the game layer gives study progress personality through a companion, rewards, cosmetics, and plaza growth without adding punishment, guilt, or competitive pressure.

The web app is the full plaza. The Chrome extension is the small pocket companion that enforces Course Guard and gives the learner a fast way to begin or return to a course.

## Goals

- Make the web app feel like a welcoming game plaza rather than an administrative dashboard.
- Give Focus Friend a meaningful but lightweight role in the study loop.
- Preserve Course Guard as the authoritative browser-side protection mechanism.
- Keep all learner data local to the browser.
- Make progress visible through mood, energy, growth, session history, cosmetics, and plaza unlocks.
- Keep every core learning action usable without entering a game mode.

## Non-goals

- No full Tamagotchi care simulation, hunger, illness, death, or punishment for missed days.
- No leaderboard, social comparison, streak pressure, or public profile.
- No full shop mini-games in the first implementation.
- No server account, cloud sync, or remote analytics.
- No reuse of proprietary Tamagotchi characters, assets, names, or exact visual layouts.

## Product structure

### Plaza home

The landing screen is a small illustrated town hub. Focus Friend is the visual center, with nearby destination cards or buildings:

- **Course Guard station** — choose a course, start a protected session, and see the current guard state.
- **Session Archive** — review completed sessions, time focused, recent returns, and growth earned.
- **Wardrobe & Plaza** — equip companion cosmetics and view unlocked plaza decorations.
- **Town Hall** — manage settings, permissions, recovery, and extension connection.

The home screen also exposes one obvious primary action: **Start a focus session**. The plaza is decorative and playful, but the study action remains faster than browsing the surrounding destinations.

### Focus Friend

Focus Friend has a small set of expressive states rather than a complex artificial-life simulation:

- Resting
- Ready
- Focusing
- Proud after a completed session
- Encouraging when Course Guard catches a distraction

Mood and energy are presentation and progression signals. They should not decay into a failure state. Breaks and completed sessions can restore or improve them.

## Light game loop

1. The learner chooses a course and starts a protected session.
2. Focus Friend changes to the focusing state and the extension begins guarding the selected course origin.
3. A completed session grants growth points and a small reward.
4. The companion responds with an animation, message, and updated mood/energy.
5. Growth unlocks cosmetics, companion expressions, plaza decorations, or new visual locations.
6. The learner equips cosmetics or decorates the plaza from the Wardrobe & Plaza destination.

Course Guard interruptions are supportive rather than punitive. The interruption displays Focus Friend, names the protected course, and offers **Back to course**. It must not subtract points or create a failure state.

## State and persistence

All state is local and versioned so the existing app can migrate safely.

### Companion state

- `growthPoints`
- `level`
- `mood`
- `energy`
- `equippedCosmetics`
- `unlockedCosmetics`
- `unlockedPlazaItems`

### Session state

- Course name and origin
- Start time and completion time
- Focused duration
- Return count
- Completion status
- Reward granted

### Guard state

- Selected course
- In-course tab and URL fallback
- Active/inactive status
- Extension connection status
- Permission status
- Last interruption reason

The state boundary must remain shared by the web app and extension through the existing secure message bridge. The extension remains authoritative for active tab enforcement; the web app remains the primary place for history, cosmetics, and plaza presentation.

## Web app experience

### Visual direction

Use an original, cheerful plaza vocabulary:

- Saturated but soft sky, grass, coral, yellow, and blue accents
- Rounded building cards and playful signboards
- Large expressive companion illustration or sprite
- Clear game-like iconography for destinations
- Layered town background with a strong readable content panel
- Small, purposeful motion for companion state changes and unlocks

The interface should feel cozy and toy-like, but controls must remain accessible and legible. Use sentence-case labels, visible focus rings, reduced-motion support, and text equivalents for all icons.

### Home layout

- Header: plaza name, connection/guard status, and settings access
- Main scene: Focus Friend in the plaza center
- Status panel: mood, energy, level, and progress to next unlock
- Destination row/grid: Course Guard, Session Archive, Wardrobe & Plaza, Town Hall
- Primary action: Start a focus session
- Recent activity: latest session and newest reward

### Destination behavior

Each destination is a real functional view, not only decoration. If a destination is unavailable because the extension is disconnected or permission is missing, show a recoverable setup state with a clear next action.

## Extension experience

The extension popup is a compact pocket version of the plaza:

- Focus Friend portrait and current mood
- Protected course name and active/inactive guard status
- Focused time or current session state
- One primary action: **Start session**, **Return to course**, or **Open plaza**
- Small reward/progress preview
- Clear permission or connection recovery message when needed

The popup does not attempt to render the full town. It should feel like opening the companion’s handheld device for a quick check-in.

## Interruption experience

When a distraction is detected, the extension/content layer shows a friendly, compact overlay:

- Focus Friend visual
- Short message naming the course
- Optional return-count context without shame
- Primary **Back to course** action
- Secondary dismiss/recovery action only when the guard state permits it

The overlay must remain usable with keyboard navigation and screen readers. It should not trap the learner in an endless loop if the course tab, permission, or extension connection is no longer valid.

## MVP boundary

The first implementation should deliver:

1. Plaza home shell and navigation.
2. Focus Friend state panel with lightweight status changes.
3. Course Guard station wired to the current start/stop flow.
4. Local session history with focused duration, returns, and rewards.
5. Basic growth points and a small cosmetic catalog.
6. Extension popup updated to match the plaza companion model.
7. Interruption overlay updated with companion context and safe recovery states.
8. Unit tests for state transitions and persistence migration.
9. At least one browser acceptance path covering setup, start, distraction, return, and completion.

Explicitly defer full shop mini-games, large cosmetic catalogs, sound, multiplayer, accounts, and cloud sync.

## Acceptance criteria

- A new learner understands the main action and can start a protected session from the plaza home.
- A completed session produces a visible companion response, persisted history, growth, and a reward.
- Course Guard still blocks configured distracting origins and returns the learner to the latest valid in-course location when possible.
- Permission loss, extension disconnect, missing tab, and invalid course URLs produce recoverable states.
- Web app and extension use the same companion/session vocabulary without duplicating authority.
- The experience looks like an original Tamagotchi Plaza-inspired learning world, not a generic productivity dashboard.
- No game mechanic penalizes the learner for taking a break or missing a day.

## Implementation sequence

1. Establish the plaza shell and route/destination model.
2. Define and migrate the local companion/session schema.
3. Connect the Course Guard flow to companion states and rewards.
4. Build the plaza home, archive, wardrobe, and town hall views.
5. Refresh the extension popup and interruption overlay.
6. Add focused motion, cosmetics, and reduced-motion behavior.
7. Add unit and browser acceptance coverage.
8. Run the existing quality checks plus the new acceptance path.
