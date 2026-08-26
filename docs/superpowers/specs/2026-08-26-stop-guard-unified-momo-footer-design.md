# Stop Guard and unified Momo footer design

Date: 2026-08-26
Status: approved for implementation

## Context

Two production-facing inconsistencies were reported after the web app and Chrome extension connection work:

1. The extension popup can start Course Guard but its **Stop guard** button does not stop it.
2. The bottom of the web app changes design between routes, and several Momo routes have no shared footer at all.

The extension investigation found that `extension/src/popup.ts` contains the correct stop-action routing, while the locally loaded `dist-extension/popup.js` predates that fix and still sends every primary-button click through the start flow. The current unit test exercises source modules, so it cannot prove that Chrome is running a fresh generated bundle.

The route audit found no semantic shared footer on Plaza, Course Guard, Session Archive, Wardrobe, or Town Hall. Routes that do render `LegalFooter` also modify it through different parent-specific CSS rules.

## Goals

- Stop an active Course Guard immediately from the extension popup.
- Make stale generated extension code detectable before Chrome verification.
- Render one visually identical Momo Town footer on every reachable web-app surface.
- Keep the footer useful, compact, responsive, and keyboard accessible.
- Preserve the existing Learning Plaza routes, local-first privacy model, and extension authority.

## Non-goals

- Replacing the router or rewriting `App.tsx`.
- Publishing to the Chrome Web Store.
- Changing guard rewards, session history, course-origin permissions, or interruption behavior.
- Copying Tamagotchi artwork or exact layouts.

## Extension behavior

The popup remains a single-action surface driven by authoritative extension state:

- `watching` → **Stop guard** → `STOP_GUARD`
- `interruption` → **Back to course** → `RETURN_TO_COURSE`
- `idle` or `permission-lost` → start/retry flow

The local extension verification command will build `dist-extension` before launching Chrome. Its real-browser smoke path will seed an active guard in extension-local storage, open the generated popup, click **Stop guard**, and verify both the rendered idle state and persisted completed session. This proves the generated popup, background worker, storage, and message boundary together.

The implementation will rebuild `dist-extension` for the currently installed unpacked extension. Chrome still requires one manual **Reload** action after the build because Manifest V3 extensions do not hot-reload generated files.

## Shared footer design

`LegalFooter` will become the single Momo Town footer used by every route. It will remain a semantic `<footer>` and contain:

- a compact Momo/Plaza identity line;
- **Plaza** and **Town Hall** navigation;
- **Privacy Policy** and **Terms of Use** links;
- a short local-first reassurance.

The component will use one class contract and one CSS definition instead of parent-specific variants. Its visual language follows the current Plaza system: warm cream surface, thick navy outline, offset green shadow, compact rounded controls, IBM Plex Sans copy, and visible coral keyboard focus. At narrow widths the groups stack without horizontal overflow. It remains below the primary task content so it does not compete with Course Guard or focus-session actions.

## Route coverage

Exactly one shared footer must render on:

- Welcome/setup and safe route fallbacks
- Plaza
- Course Guard
- Session Archive
- Wardrobe
- Town Hall
- Calibration/setup states
- Focus, paused, notes pause, and gentle reset
- Quick Review
- Reflection
- Session Reward
- Privacy Policy
- Terms of Use

Town Hall's duplicated standalone legal-link row will be removed once the shared footer is present.

## Error handling and accessibility

- A failed popup command keeps the button enabled and shows the existing inline error message.
- Stop remains immediate and has no confirmation dialog.
- Footer navigation uses real hash destinations and a labelled `<nav>`.
- All links keep a visible focus ring and a minimum comfortable touch target.
- The footer communicates no state by color alone and adds no animation.

## Testing and acceptance

Implementation proceeds test-first.

1. Add a failing route-matrix test proving every route has exactly one shared footer with the same navigation contract.
2. Add a failing generated-extension smoke assertion proving **Stop guard** changes an active state to idle through the built popup.
3. Implement the shared footer placement and unified CSS.
4. Make Chrome verification build the extension first and rebuild the local unpacked bundle.
5. Run unit tests, formatting, lint, typecheck, production builds, Playwright desktop/mobile route coverage, and the real Chrome bridge verification.
6. Reinspect all route bottoms at desktop and 390px widths before committing implementation.

## Rollout

The web footer ships through the normal GitHub Pages workflow. The extension fix is activated locally by rebuilding and reloading the unpacked extension. A Chrome Web Store release, if used later, is a separate publishing step.
