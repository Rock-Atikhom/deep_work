# Momo Whole-App Consistency Design

## Goal

Make the entire Deep Work Companion web experience feel like one original Momo
Plaza game dashboard. Preserve all study, privacy, extension, data, and reward
behavior while replacing the remaining editorial visual language and correcting
the Archive's mobile layout defect.

## Product decisions

- Momo Plaza is the app's only visual concept. The former beige editorial
  language, large Newsreader display headings, and unscoped legacy controls do
  not appear on user-facing screens after this change.
- The existing light game loop remains unchanged: care, mood, growth, rewards,
  unlockable cosmetics, Course Guard, local data, and the Momo sprout planter
  keep their current behavior and data model.
- Privacy Policy and Terms of Use remain complete legal documents. They gain a
  calm Momo "Town Notice" frame but keep a restrained reading column, sentence
  case headings, and high-contrast body copy.
- No third-party visual assets, animations, or UI libraries are added. Momo's
  in-repository CSS art remains the companion artwork.

## Information architecture and visual system

The app will use a small number of route-purpose modifiers rather than a
different visual language for every screen:

| Surface | Existing route or phase | Momo treatment |
| --- | --- | --- |
| Arrival and setup | `#/welcome`, setup | **Plaza gate**: Momo sky, cream cards, clear choice between camera-aware and timer-only study, then an intention panel. |
| Course Guard | `#/course-guard`, setup form | **Course Guard station**: a blue door card for the extension connection and a separate cream study-intention card. |
| Plaza support | `#/wardrobe`, `#/archive`, `#/town-hall` | **Town destinations**: retain current Momo screens; repair mobile Archive layout and align their controls with shared behavior. |
| Active study and recovery | focus, pause, gentle reset, calibration, quick review, reflection, session reward | **Momo study room**: timer and review states use the Momo palette and bordered game panels. The timer remains the most prominent element; no decorative animation competes with it. |
| Local tools | settings, decks, history, deletion dialog | **Momo workbench**: compact, calm panels using the shared card, form, status, and destructive-action treatments. |
| Legal | `#/privacy`, `#/terms` | **Town notices**: a small Plaza header and quiet cream reading card; legal copy does not become game copy. |

### Shared UI rules

- Use the established Momo palette (`sky`, `cream`, `ink`, `pink`, `lemon`,
  `leaf`, and `blue`), heavy navy outlines, varied rounded corners, and
  shadow offsets that consistently fall down and right.
- Use the existing rounded Momo font stack for game and utility screens. Legal
  prose may keep the existing readable body font but must no longer use the
  editorial display face as its primary identity.
- Keep all controls semantic (`button`, `a`, `input`, `select`, and `dialog`)
  and retain their labels, disabled states, and live regions.
- Give every route a visible path back to Plaza or setup when it is not already
  part of the setup flow.
- Retain existing content unless it names the retired visual concept. Existing
  legal obligations and privacy claims are not rewritten.

## Motion and interaction policy

The product is an educational companion with frequent focus controls. Motion
therefore prioritizes Jakub Krehel's subtle polish, uses Jhey Tompkins-style
delight only for Momo and earned rewards, and applies Emil Kowalski's
restraint to repeated controls.

- Momo may keep one gentle idle float on Plaza, Town Hall, and earned-reward
  scenes. It uses `transform` only and is removed for both system reduced
  motion and the app's "Use gentler motion" preference.
- Pointer hover may lift a game card or button in at most 120–180ms with a
  project-specific cubic Bézier. Pressed controls use a small positional
  response that preserves the physical toy-panel metaphor.
- Keyboard focus never moves a control. It uses an immediate high-contrast
  outline and offset only.
- Forms, timer updates, pause/resume, and keyboard-triggered commands do not
  animate. Functional changes remain immediately legible.
- Modal, inline status, and optional tool states use short opacity/transform
  transitions only when that improves orientation; no pulsing indicators,
  repeated-list staggers, blur-on-everything entrances, or bouncing utility
  controls are introduced.
- `prefers-reduced-motion: reduce` and `html[data-reduced-motion="true"]`
  disable decorative animation and transitions while leaving every action
  usable.

## Responsive requirements

- Audit every direct hash route at 1440px and 390px wide. Session-only states
  are also exercised through their real setup → focus → reflection/reward
  path rather than treated as direct hash pages.
- At 390px, every route has `scrollWidth <= clientWidth`, no clipped labels,
  and controls remain at least 44px high where a direct touch action is
  expected.
- The Memory Garden replaces its narrow two-column hero layout with a single
  column before the planter label and seed count can collide. Its collected
  sprouts and keepsake copy remain fully visible.
- Wide screens keep readable constraints: utility pages use compact columns;
  setup and destination pages can use an asymmetric two-column arrangement
  only where the content remains optically aligned.

## Implementation boundaries

- Add explicit Momo surface classes at App render boundaries. CSS applies only
  inside those classes, so extension behavior, component APIs, and unrelated
  tests are not changed by a global restyle.
- Extend `src/ui/styles.css` with a single, ordered Momo consistency section
  after the current Momo route styles. It owns shared tokens, responsive
  overrides, focus treatment, and reduced-motion fallbacks for the newly
  wrapped legacy surfaces.
- Reuse existing `FocusFriend`, `MomoSproutPlanter`, `MomoMemoryGarden`,
  `MomoTownHallScreen`, and form components. Do not introduce a second pet or
  duplicate state.
- Keep `App.tsx` responsible for state, events, persistence, and route
  selection. Screen components remain presentational.

## Verification and acceptance criteria

1. The legacy editorial look is absent from arrival, Course Guard, Wardrobe,
   active-study, recovery, local-tool, and legal surfaces; Plaza, Archive,
   Town Hall, and rewards continue to look like one family.
2. The Archive's 390px view shows the complete planter title, seed total, and
   collected-sprout card without clipping or horizontal overflow.
3. Pointer hover and press feedback work on Momo controls; keyboard focus is
   visible without an animated movement.
4. System reduced motion and the app preference disable the Momo idle and
   decorative transitions without hiding a control or final state.
5. Existing data export, delete confirmation, Course Guard controls, focus
   lifecycle, reward calculation, and navigation remain intact.
6. Component tests cover the new app surface markers and the mobile Archive
   layout contract; browser tests cover each direct route at desktop and
   mobile, plus the real session journey and reduced-motion behavior.
7. Before the implementation commit, run formatting, lint, typecheck, unit
   tests, web build, extension build, vision-manifest validation, Playwright,
   visual route checks, and `git diff --check`.

## Out of scope

- Changing the game-loop rules, reward thresholds, persistence schema, or
  Chrome extension protocol.
- Replacing the original Momo CSS artwork with copied Tamagotchi assets.
- Changing legal claims or removing legal content.
- Adding sound, continuous background effects, or unrelated feature work.
