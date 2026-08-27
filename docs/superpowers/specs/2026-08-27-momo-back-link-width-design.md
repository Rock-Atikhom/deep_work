# Momo back-link width refinement

## Context

The shared back-link styling and interaction contract are defined in `docs/superpowers/specs/2026-08-27-momo-navigation-town-hall-redesign-design.md`. A desktop Archive screenshot shows that route-specific layout CSS expands the otherwise content-sized `← Back to Plaza` control across the full content width.

## Design

Keep `.momo-back-link` as the shared accessible control with its existing yellow surface, navy border and offset shadow, 46px minimum height, focus ring, and `#/plaza` destination.

On desktop, the Archive route wrapper must not override the control’s natural inline-flex width. The visible control should fit its label and padding rather than read as a full-width banner. On mobile, retain the existing route-width treatment so the control remains easy to tap across the available content width.

No route, component API, navigation, persistence, or button behavior changes are included.

## Verification

Extend the existing Momo destination Playwright contract to assert that the shared back link remains compact on desktop while retaining its existing minimum height, border, focus, and route assertions. Run the focused red-green test, then the full unit, static, build, and Playwright verification suites.

## Non-goals

- No redesign of the yellow/navy visual treatment.
- No changes to other primary, destructive, or text controls.
- No changes to responsive breakpoints beyond the desktop/mobile width distinction.
