# Momo navigation and Town Hall redesign

Date: 2026-08-27
Status: approved direction, pending written-spec review

## Context

The current Momo routes do not share one back-navigation treatment. Archive and Town Hall use plain underlined text links, while Wardrobe and Course Guard use yellow framed controls. The supplied screenshots make the inconsistency especially visible, and a full route audit is needed to ensure the redesign does not introduce another outlier.

Town Hall is also visually detached from the rest of Momo Plaza. Its blue page field, oversized pink hero, pink disconnected badge, and mixed green/yellow/pink settings cards read like a separate admin theme rather than one part of the same study companion.

## Goals

- Give Archive, Town Hall, Wardrobe, and Course Guard one shared `Back to Plaza` link component and one visual contract.
- Make the control look like an intentional navigation action: yellow fill, navy outline, offset navy shadow, comfortable hit area, and visible keyboard focus.
- Bring Town Hall into the established Plaza visual world without changing its settings, extension, local-data, or navigation behavior.
- Replace Archive's large blank collected-sprouts area with a deliberate, compact first-sprout empty state.
- Preserve the existing Momo artwork and responsive behavior.
- Keep the redesign readable and usable at 390px.

## Non-goals

- No router rewrite or URL changes.
- No change to Town Hall settings behavior or extension handshake behavior.
- No new visual theme, gradients, animation system, or dependencies.
- No redesign of Plaza, populated Archive content, Wardrobe, Course Guard, or the shared footer beyond the back-navigation control needed for consistency.

## Design direction

### Shared back navigation

Create one small presentational `MomoBackLink` component with a real hash link to `#/plaza` and the accessible name `← Back to Plaza`. It will use a dedicated shared back-link class rather than inherit the green action-button color or duplicate page-specific markup. The component will be rendered in the route headers for Town Hall, Wardrobe, and Course Guard, and in the Archive route shell.

Visual contract:

- yellow surface using the existing Plaza sun token;
- 3px navy border and the existing offset navy shadow;
- 46px minimum height and horizontal padding that keeps the label on one line;
- hover darkens the yellow surface without changing the control's role or layout;
- no parent-specific text-link override;
- focus-visible remains a high-contrast, non-layout-moving outline.

### Archive empty state

When no sprouts exist, the collected-sprouts panel will show a composed empty state rather than a heading followed by a large empty region. It will explain that completing a focus session creates the first sprout and offer a real link back to Plaza. Once sprouts exist, the current list remains unchanged.

### Town Hall

Town Hall will remain a single-column settings destination, but its page-level wrapper will follow the Plaza route family:

- warm paper/cream page background rather than a full-height blue field;
- a restrained sky-blue header band containing the shared back control, route eyebrow, and connection status;
- one calm cream hero/intro surface with Momo artwork and title, rather than a dominant pink admin banner;
- cream settings panels with a single yellow preference panel for emphasis;
- green local-data panel retained as the privacy/keepsake accent;
- pink limited to Momo's decoration, disconnected/error state, and small secondary emphasis;
- the same navy outline and offset shadow rhythm used by Plaza, Course Guard, Wardrobe, and Archive;
- typography and spacing stay within the existing Momo tokens and font stack.

The connection state remains semantically distinct through its existing text and badge. Color is supplemental, not the only signal.

## Component and data flow

`MomoBackLink` has no state and accepts no behavior callback. Its only responsibility is the shared link presentation. Route components continue to own their existing content and callbacks. `App.tsx` continues to own route selection; only the Archive shell imports the component directly.

Town Hall keeps all current props and event handlers. CSS changes are scoped to `.momo-town-hall` and the shared back-link class so existing session and extension surfaces are unaffected.

## Accessibility and responsive behavior

- Use a native anchor with the existing hash destination.
- Keep the accessible name identical on every route.
- Preserve a visible focus ring and 44px-class hit area.
- Do not rely on color alone for connection status or errors.
- At 390px, stack Town Hall header content and settings controls without horizontal overflow.
- Keep all important headings and button labels readable without forced multi-line controls.

## Testing and acceptance

1. Add a component or route test that verifies the shared back-link label and `#/plaza` destination.
2. Extend the E2E route matrix to assert the same accessible back link on Archive, Town Hall, Wardrobe, and Course Guard at desktop and mobile widths.
3. Add a focused Town Hall visual-contract assertion for the unified page background/surface treatment and shared button class.
4. Add an Archive empty-state assertion for the first-sprout guidance and Plaza link.
5. Preserve existing settings, extension connection, direct-route, keyboard, reduced-motion, and mobile overflow tests.
6. Run formatting, lint, typecheck, unit tests, production build, full E2E tests, and Chrome smoke verification.
7. Reinspect the supplied route screenshots after the change, with specific attention to the back controls, Town Hall's first viewport, and Archive's empty state.

## Rollout

The change ships with the normal web-app build. The extension is unaffected, but the existing extension build/smoke checks remain part of the acceptance suite because this repository ships both surfaces.
