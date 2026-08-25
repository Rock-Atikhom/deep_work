# Momo Town Hall Design

**Status:** Approved for planning

## Purpose

Replace the legacy editorial Town Hall settings route with a Momo Plaza control room. The route must feel like part of the same light companion game as the Plaza and Memory Garden while preserving every existing setting, privacy control, and extension-status behavior.

## Scope

This work changes only `#/town-hall`.

- Keep its return-to-Plaza link and extension connection status.
- Keep the current duration, sensitivity, sound, reduced-motion, reset, export, delete, privacy, and terms behaviors.
- Keep the existing confirmation dialog and local-data status messages.
- Leave the separate advanced-study settings panel outside Town Hall unchanged.
- Do not add new progression systems, remote data, or third-party Tamagotchi assets.

## Experience

Town Hall becomes **Momo's Mayor's Desk**: a playful private control room for setting up the next study day.

- A Plaza-style top bar contains `← Plaza`, the Town Hall label, and the extension badge.
- A sky-blue hero panel introduces “Momo's Town Hall” with a small existing Momo companion illustration and a direct explanation of the page's job.
- Three equal, thick-outlined control cards hold the existing duration, sensitivity, and sound selects. Their labels use player-facing language but retain the current option values and callbacks.
- A compact comfort card contains the reduced-motion preference and explains it in plain language.
- A clearly separated “Momo's keepsakes desk” contains reset, export, delete, privacy, and terms. Delete remains visually distinct and still requires the existing confirmation dialog.

The visual system follows the established Plaza language: navy outlines, cream paper panels, sky-blue and leaf-green surfaces, pink and lemon action accents, rounded display type, shallow offset shadows, visible focus rings, and one-column mobile stacking.

## Architecture

Create a dedicated `MomoTownHallScreen` rather than nesting the generic `SettingsScreen` inside `TownHallScreen`.

- The component owns only the Town Hall presentation and receives the current controlled values plus the existing callbacks as props.
- `App` continues to own persistence, reset, export, deletion confirmation, and extension connection state. It passes these unchanged into the new screen.
- The existing generic `SettingsScreen` remains available for the non-Town-Hall advanced-study flow.
- New styling is rooted under `.momo-town-hall` so it cannot restyle other screens.

## Accessibility and responsive behavior

- Preserve native labels and controls for all preferences.
- Use semantic headings, a labeled main region, and a meaningful image label for Momo.
- Preserve keyboard-visible focus for links, selects, checkboxes, and buttons.
- At narrow widths, stack the three control cards and keep all actions reachable without horizontal overflow.

## Verification

- Add a regression test for `#/town-hall` that proves it renders Momo's Town Hall and no legacy “Keep your study world yours” heading.
- Test the component's real controls and callbacks, including the deletion confirmation path from the Town Hall route.
- Run format, lint, typecheck, unit, build, extension build, manifest, and browser tests.
- Verify the deployed `#/town-hall` route in a fresh browser context after GitHub Pages completes.
