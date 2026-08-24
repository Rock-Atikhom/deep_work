# Momo Game Dashboard Redesign

**Date:** 2026-08-24
**Status:** Approved visual direction — awaiting specification review

## Problem

The current `#/plaza` route contains the right feature categories, but its large editorial heading,
quiet palette, and passive mascot scene make it read as a learning dashboard. It does not visibly
deliver the Tamagotchi Plaza-style game loop the product calls for.

## Product goal

Make Learning Plaza feel like Momo's small, friendly game world while keeping Course Guard as the
real learning action. A learner should immediately see a character to care for, the character's
current state, clear game-like actions, and the places that unlock through focused study.

This is an original companion experience. It must not copy Tamagotchi characters, assets, logos,
or interface art.

## Chosen direction

Use a **bright toy-town dashboard** rather than a subdued editorial page or a monochrome virtual
pet device. The signature element is Momo's large room: a playful scene with a chunky game HUD and
four tactile care controls directly beneath it.

### Visual system

- Palette: Sky `#9DDCFF`, Bubblegum `#FF9FC4`, Lemon `#FFD95A`, Leaf `#79C779`, Ink `#24324A`,
  Cream `#FFF9EA`.
- Surfaces: thick navy outlines, small offset shadows, rounded toy buttons, framed map tiles, and
  small pixel-like decorative marks.
- Typography: compact rounded system display stack for game labels and actions; IBM Plex Sans for
  readable body copy. The large Newsreader headline is removed from the Plaza route.
- Motion: one intentional Momo idle bounce and button press feedback; both are disabled by
  `prefers-reduced-motion`.

## Dashboard hierarchy

```
┌ Momo's Plaza ───────── LV 2 · 40 growth · Ready · 3 rewards ┐
│                                                              │
│  ┌──────────── Momo's room / companion scene ────────────┐  │
│  │                  Momo + speech bubble                  │  │
│  └───────────────────────────────────────────────────────┘  │
│  [ Feed ] [ Play ] [ Rest ] [ Study ]                         │
│                                                              │
│  Plaza map:  Course Guard | Reward Chest | Wardrobe | Archive │
│  Today's quest: complete a learning session to grow Momo      │
└──────────────────────────────────────────────────────────────┘
```

The first viewport must show Momo, status, all four care actions, and the Course Guard entry. A
learner should never need to infer how to begin the game loop.

## Functional loop

### Care actions

Care is low stakes, local, and cannot create a failure state.

- **Feed:** increases Momo's energy by 10, capped at 100; mood becomes `ready`.
- **Play:** increases energy by 4, capped at 100; mood becomes `proud`.
- **Rest:** increases energy by 6, capped at 100; mood becomes `resting`.
- **Study:** navigates to Course Guard. Growth still comes only from a completed or ended Course
  Guard session, never from repeatedly pressing care buttons.

Care actions are immediately persisted through the existing Plaza repository. They do not need a
currency, cooldown, streak, timer, hunger, illness, or punitive energy decay.

### Growth and rewards

The existing session reward calculation remains the source of growth. The dashboard makes it
visible through a level meter, a next-unlock preview, a reward chest count, and a short "today's
quest" message. Wardrobe remains the place to equip unlocked cosmetics.

### Course Guard relationship

Course Guard is represented as the blue schoolhouse-style map destination and the `Study` action.
It retains its existing extension authority and connection states. The dashboard never pretends a
guard session is active when the extension is disconnected.

## Component and state boundaries

- `PlazaGameHud`: name, level, growth, mood, energy, reward count, and Town Hall link.
- `MomoHomeScene`: companion illustration, room decorations, and contextual mood line.
- `CareActionBar`: Feed, Play, Rest, and Study buttons; emits user intent only.
- `PlazaMap`: route cards for Course Guard, Reward Chest/Wardrobe, Archive, and Town Hall.
- `TodayQuest`: compact progress and next-unlock summary.
- `FocusFriend`: continues to own the original Momo illustration and mood/cosmetic rendering.
- Plaza reducer: gains a single care-action event that updates existing `mood` and `energy` fields.
  No storage schema change is required because those fields are already persisted.

## Route behavior

- `#/plaza` becomes the game-first home screen.
- `#/course-guard`, `#/wardrobe`, `#/archive`, and `#/town-hall` keep their current routes and
  functionality, but use the same toy-town visual language where practical.
- Existing legacy timer and camera flows remain intact outside the Plaza route.

## Accessibility and responsiveness

- Each care control is a labelled native button with visible keyboard focus.
- Status remains readable as text; color and illustration are supplementary.
- The desktop map collapses into a two-column then one-column grid without hiding actions.
- Decorative scene elements are hidden from assistive technology.
- The motion preference disables bounces and press animations.

## Acceptance criteria

1. The live Plaza first viewport is recognizably a game dashboard rather than an editorial page.
2. The first viewport includes Momo, game HUD, Feed, Play, Rest, Study, and Course Guard.
3. Feed, Play, and Rest update and persist energy/mood without changing growth.
4. Study opens Course Guard; the existing disconnected/permission behavior remains accurate.
5. Growth, reward count, and next unlock are visible without navigating away from the Plaza.
6. Existing Plaza, Course Guard, storage, extension, and accessibility tests remain green.
7. Browser acceptance confirms the new controls and keyboard navigation work on `#/plaza`.

## Verification

- Unit tests for each care reducer event and its energy cap.
- Component tests for the HUD, care action labels, and Study navigation.
- Browser acceptance for the game-first Plaza route, care action feedback, Course Guard navigation,
  and a mobile viewport.
- Existing format, lint, typecheck, app build, extension build, manifest, and full test suite.

## Scope boundary

This iteration does not add a backend, multiplayer, notifications, currency, daily streaks,
maintenance punishment, Tamagotchi assets, or Chrome Web Store publishing. The production bridge
configuration remains a separate release task requiring a stable extension ID.
