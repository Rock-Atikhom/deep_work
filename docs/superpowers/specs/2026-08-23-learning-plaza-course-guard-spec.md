# Learning Plaza Course Guard Specification

Status: Ready for agent review

This specification replaces the earlier Pomodoro and camera-awareness product direction for the new primary experience. The existing camera-aware PWA modules remain legacy functionality until a separate migration decision removes them.

## Problem Statement

Online learners often open a lesson and then drift into unrelated tabs, feeds, or sites. The current project is difficult to understand because its primary language and flow describe a timed, camera-aware focus session, while the intended product is a small browser intervention that helps a learner return to an online course.

The learner needs a clear, private, friendly flow that:

- starts from the online course they are actually taking;
- notices only when they leave that course website;
- interrupts the doomscrolling transition with a calm return prompt;
- records a small local session summary;
- remains useful without a timer, camera, attention score, account, or cloud service; and
- makes the web app and Chrome extension feel like one understandable product.

## Solution

Deep Work Course Guard will use a web app plus a desktop Google Chrome extension.

The web app becomes the **Learning Plaza**, a minimal dashboard with three destinations:

1. **Course Guard** — the primary Companion Status screen.
2. **Session History** — local summaries of completed and incomplete guard sessions.
3. **Settings** — Focus Friend personalization, privacy/local data, and extension connection help.

The primary screen centers an original soft **Focus Friend** mascot. The learner enters a Course URL, states a concise learning goal, sees the detected Course Website, and uses one primary **Start Course Guard** action. The Focus Friend responds to guard lifecycle events with simple expressions and short messages.

The Chrome extension is authoritative for guard state. It watches the selected Course Website origin while a guard session is active. Tabs on the same origin remain allowed. When the active tab changes to another origin, the extension shows a full-page in-page Return Interruption containing a compact Focus Friend reaction, one supportive message, and one **Back to course** action.

The web app connects to the extension through an allowlisted, versioned external messaging bridge. It never claims that guard is active until the extension confirms it. State and approved session events remain local; no page content, screenshots, camera frames, browsing history, or attention inference crosses the bridge.

The visual direction is inspired by the useful pattern of a cheerful plaza hub and companion dashboard, not by copied Tamagotchi branding, characters, assets, or exact interface. The product remains simple and non-competitive.

## User Stories

1. As an online learner, I want to understand the product in one sentence, so that I know it helps me return to my course rather than measuring my attention.
2. As an online learner, I want to use the product without a Pomodoro schedule, so that I can decide when my guard session starts and ends.
3. As an online learner, I want the web app to feel like a friendly Learning Plaza, so that the product is approachable rather than surveillance-oriented.
4. As an online learner, I want to see a Focus Friend on the primary screen, so that the guard has a welcoming human-scale presence.
5. As an online learner, I want to name my Focus Friend, so that the dashboard feels personal.
6. As an online learner, I want to choose from three preset Focus Friend color styles, so that I can personalize the product without an inventory or reward system.
7. As an online learner, I want to see a Ready Focus Friend state before a session, so that I know the product is waiting for me.
8. As an online learner, I want to see a Guarding course state after a confirmed start, so that I know the extension is active.
9. As an online learner, I want to see a Return to course state after I leave the Course Website, so that the interruption feels supportive rather than punitive.
10. As an online learner, I want to see a Session complete state after I stop manually, so that the end of the session is clear.
11. As an online learner, I want to enter a Course URL, so that the extension knows which website to guard.
12. As an online learner, I want the web app to show the detected Course Website before starting, so that I can catch a wrong URL.
13. As an online learner, I want to state a concise learning goal, so that the guard session has a clear purpose without requiring a timer.
14. As an online learner, I want the primary action to say Start Course Guard, so that the next step is obvious.
15. As an online learner, I want the primary action disabled or replaced when the extension is disconnected, so that the web app never pretends that protection has started.
16. As an online learner, I want a clear Connect extension state, so that I know how to recover when the extension is missing or unavailable.
17. As an online learner, I want a clear Permission needed state, so that I understand why Chrome access is required.
18. As an online learner, I want the permission explanation to say that access detects when I leave the course website and does not read page content, so that I can make an informed choice.
19. As an online learner, I want permission to be requested only when I start guarding a course, so that the extension does not ask for broad access during installation.
20. As an online learner, I want permission to be removed when I stop guarding, so that the extension returns to a smaller access boundary.
21. As an online learner, I want guard to remain off when I decline permission, so that I am never given a false sense of protection.
22. As an online learner, I want an active session to end safely if permission is revoked, so that the product reports a real failure instead of claiming protection continued.
23. As an online learner, I want the extension to allow all tabs on the selected Course Website origin, so that lessons, quizzes, and course pages remain usable.
24. As an online learner, I want switching to another origin to produce a Distraction Signal, so that the product addresses the doomscrolling transition it can actually observe.
25. As an online learner, I want the Return Interruption to cover the current page clearly, so that I notice it even on an unrelated site.
26. As an online learner, I want the interruption to show my Focus Friend, so that the intervention feels like a gentle companion response.
27. As an online learner, I want one short supportive message, so that I am not forced to read a lecture.
28. As an online learner, I want one Back to course button, so that returning takes one obvious action.
29. As an online learner, I want Back to course to return to my most recent in-course tab and URL, so that I resume the exact lesson context.
30. As an online learner, I want a safe fallback to the original Course URL if the last course tab is gone, so that the button never sends me to an unrelated page.
31. As an online learner, I want to stop Course Guard immediately from the web app, so that I remain in control.
32. As an online learner, I want to stop Course Guard from the extension popup, so that I have an emergency stop even when the web app is not visible.
33. As an online learner, I want stopping to save a Successful Guard Session without a confirmation dialog, so that ending the session is fast and unambiguous.
34. As an online learner, I want interruption events treated as events rather than failures, so that the product does not shame me.
35. As an online learner, I want no minimum session duration, so that I can use the guard for a short lesson or a long study block.
36. As an online learner, I want the web app to update while the extension is active, so that the Focus Friend and status reflect the real guard state.
37. As an online learner, I want a connection warning if live updates stop, so that stale information is not presented as current.
38. As an online learner, I want the extension popup to remain compact, so that it provides status and emergency Stop without recreating the dashboard.
39. As an online learner, I want Session History to show the Course Website, start and stop time, active time, interruption count, return count, and successful/incomplete status, so that I can review what happened.
40. As an online learner, I want Session History to avoid scores and rankings, so that review does not become competition.
41. As an online learner, I want local history to persist until I clear it, so that I can review past sessions without an account.
42. As an online learner, I want one clear Clear history action, so that I can remove local records myself.
43. As an online learner, I want Settings to contain only Focus Friend, privacy/local data, and extension connection controls, so that the product stays minimal.
44. As an online learner, I want sound reactions disabled by default, so that the companion does not create unexpected noise.
45. As an online learner, I want to enable optional sound later, so that I can choose a more expressive experience when appropriate.
46. As an online learner, I want the Focus Friend to react to guard lifecycle events, so that its behavior feels connected to my actions.
47. As an online learner, I want the Focus Friend to respond only to observable guard events, so that the product does not infer my emotions or mental attention.
48. As an online learner, I want the extension to work without reading page content, so that the privacy boundary is easy to understand.
49. As an online learner, I want the extension to work without webcam, gaze, face, keyboard, mouse, or screenshot monitoring, so that the new product is not a surveillance tool.
50. As an online learner, I want the web app to explain when the extension is not installed, so that I know why Start Course Guard is unavailable.
51. As an online learner, I want the product to support the published GitHub Pages web app and local development, so that I can test the same bridge flow safely.

## Implementation Decisions

### Product boundary

- The primary product is the online-learning Course Guard, not the earlier timer/camera focus flow.
- A Successful Guard Session starts when the extension confirms guard and ends when the learner stops manually. A session has no required duration.
- A Distraction Signal means only that the active tab left the selected Course Website origin. It is not evidence of mental distraction.
- The existing camera-aware PWA vocabulary remains legacy and must not leak into the new Course Guard copy.
- The product is v1 desktop Google Chrome only.

### Learning Plaza experience

- The web app is the primary setup and review surface.
- The three destinations are Course Guard, Session History, and Settings.
- Course Guard is the default destination and contains Companion Status.
- Companion Status contains the Focus Friend, current connection/guard state, Course URL setup, simple live session signals, and one primary Start Course Guard action.
- History and Settings are secondary navigation. There are no shops, coins, inventory, levels, streaks, leaderboards, rankings, rewards, or pet-maintenance mechanics.
- The visual system may adapt plaza, hub, pastel, and companion patterns, but all characters, names, assets, layout details, and copy must be original.

### Focus Friend

- The Focus Friend is an original soft mascot.
- Personalization consists of a custom name and three preset color styles.
- The four states are Ready, Guarding course, Return to course, and Session complete.
- The mascot reacts to start, leaving the course, returning, and manual completion.
- Responses use expressions, small animations, and short text. Sound is optional and off by default.
- The mascot never displays an attention score, health meter, mood diagnosis, failure state, or reward level.

### Extension authority and bridge

- The extension is the sole authority for Course Guard state and browser-origin observation.
- The web app uses a single injected Course Guard bridge adapter rather than accessing Chrome APIs from React components.
- The bridge is versioned and exposes only the minimum commands and events needed for connection, state retrieval, start, stop, and live status.
- The production web app origin and approved local development origins are the only external messaging senders.
- The extension validates sender origin, protocol version, message type, payload shape, selected Course URL, and current state before acting.
- The web app cannot mark a session active from a local click. It must wait for an authoritative extension response.
- The web app opens the live channel; the extension replies and emits state changes on that channel. If the channel closes or becomes stale, the web app shows Disconnected or a connection warning.
- The extension ID is stable in production. A separate configured ID may be used for unpacked local development.
- The bridge transports guard state and approved local event fields only. It never transports page content, screenshots, camera frames, detailed browsing history, or attention inference.

### Permissions and privacy

- Storage access needed for the extension's local state is required by the extension.
- Course-origin host access is optional and requested at guard start for the selected origin only.
- The permission explanation says that access detects leaving the Course Website and does not read page content.
- Permission consent is extension-controlled. If Chrome requires an extension user gesture or host-access request, the extension owns that step; the web app remains Permission needed until confirmation.
- The extension checks current permission before starting and removes the selected course-origin access when guard stops.
- If permission is declined, guard remains off.
- If permission is revoked during an active session, the extension stops protection, reports the failure, and saves an incomplete session rather than a successful one.
- The extension stores only the active guard state and approved local summary fields. The web app stores its local summaries and preferences in its existing local repository boundary.
- There are no accounts, cloud sync, remote analytics, server-side history, or data sale.

### Guard lifecycle

- The extension's existing pure guard reducer remains the highest domain seam for origin and phase behavior, expanded as needed for permission, connection, return, and incomplete-session states.
- Start validates a usable HTTP(S) Course URL, derives its origin, records the starting URL, and begins watching only after permission and extension confirmation.
- All tabs on the selected origin remain allowed.
- An active tab on another origin changes the extension to Return Interruption and increments interruption count once for the transition from watching.
- Returning to the selected origin changes the extension back to guarding and increments return count once for the interruption-to-course transition.
- Back to course returns to the latest known in-course tab and URL. If unavailable, it uses the setup Course URL. It never redirects to a generic or unrelated page.
- Stop is immediate from the web app or popup, hides the interruption, removes course-origin permission, emits Session complete, and saves the local summary.
- Browser-restricted pages and unavailable content-script targets must fail safely without claiming that guard is active or attempting an unsafe redirect.
- Background worker restart must reconstruct authoritative state from local extension storage and restore the correct popup/content behavior.

### Interruption surface

- The Return Interruption is a full-page in-page overlay inside the current tab, not a new external site and not a tab-closing action.
- The overlay has an accessible dialog role, a visible focus target, a Focus Friend reaction, one short supportive message, and one Back to course button.
- The primary copy should remain close in meaning to “Let’s head back to your lesson.”
- The overlay must not claim the learner is distracted, bad, failing, or being monitored.
- The extension popup provides compact status and emergency Stop; it does not reproduce the full Learning Plaza.

### Local Session History

- Each summary stores Course Website, start time, stop time, active time, interruption count, return count, and successful/incomplete status.
- The extension may retain the selected Course URL and latest return URL required to perform the current session safely. It must not retain unrelated URLs as browsing history.
- History is local and persists until explicit Clear history.
- Clearing history removes the approved summary records from the web app and any corresponding completed-session records owned by the extension, without changing Focus Friend settings or the installed extension itself.
- A permission-revoked or browser-failed session is incomplete, not a failure score.

### Settings

- Focus Friend controls: name and three color presets.
- Privacy and local data: permission explanation, local-only policy, Clear history, and no-camera/no-content-reading statement.
- Extension connection: Connected, Disconnected, Permission needed, reconnect help, and extension install guidance.
- Settings do not expose thresholds, productivity scores, gamification, notification centers, or unrelated legacy camera controls in the new primary flow.

### Recommended code seams

- Keep the existing pure guard reducer as the domain seam for deterministic lifecycle tests.
- Add one `CourseGuardBridge` interface at the application boundary, with a Chrome external-messaging adapter and a fake adapter for app tests.
- Keep local persistence behind the existing repository interface, extending its versioned root and summary contracts rather than coupling screens directly to IndexedDB.
- Keep the Focus Friend state mapping pure so visual states can be tested without animation timing or browser APIs.
- Keep content-script overlay rendering behind extension message handling; content scripts must not own authoritative state.
- Preserve the existing injectable repository, camera, and vision seams for legacy flows while the new Course Guard path uses the bridge seam.

## Testing Decisions

Good tests assert observable behavior at the highest available seam. They should verify user-visible state, durable local data, validated bridge messages, and extension transitions. They must not assert private React implementation details, CSS class names, timer internals, or Chrome API call counts when a visible result can be tested instead.

### Domain tests

- Extend the existing guard reducer tests for start validation, same-origin tabs, origin changes, one interruption per transition, return count, latest return URL, fallback Course URL, immediate stop, permission denial, permission revocation, and worker-state recovery.
- Add pure bridge-protocol validation tests for allowed origins, protocol version, unknown commands, malformed payloads, stale responses, and impossible state transitions.
- Add pure Focus Friend mapping tests for Ready, Guarding course, Return to course, Session complete, Disconnected, and Permission needed.

### Web app journey tests

- Extend the existing Testing Library app journeys, which already inject a repository and external camera/vision adapters, to inject a fake Course Guard bridge.
- Test disconnected startup, extension connection, Course URL validation, permission-needed state, confirmed start, live status updates, interruption count, return count, immediate stop, session-complete summary, incomplete-session warning, and reconnect behavior.
- Test that the web app never renders Guarding course solely because the Start button was clicked.
- Test keyboard focus and accessible names for the primary action, navigation destinations, status messages, and Clear history.

### Persistence tests

- Extend the existing IndexedDB repository tests for the new versioned Course Guard summaries, local persistence after reload, idempotent completion, incomplete-session recovery, clear-history behavior, and preservation of Focus Friend settings.
- Test that no browsing-history collection, page-content field, screenshot field, camera field, or attention-score field is written to the local summary contract.

### Extension integration and manual acceptance

- Build the Manifest V3 extension and verify that the manifest contains only the approved external-message allowlist and permission strategy.
- In desktop Chrome, test extension missing, extension installed, bridge handshake, permission grant, permission denial, permission revocation, active same-origin tabs, cross-origin interruption, return fallback, popup Stop, worker restart, restricted browser pages, and session completion.
- Verify the full-page interruption retains focus, exposes one Back to course action, and never reads or renders page content.
- Verify the GitHub Pages web app and localhost development origin use the intended production/development extension IDs.
- Run the existing project checks and extension build before marking the implementation ticket complete.

## Out of Scope

- Pomodoro intervals, fixed breaks, countdown-based discipline, or required session durations.
- Webcam, camera, gaze, face, head-pose, keyboard, mouse, keystroke, screenshot, page-content, audio, or biometric monitoring for Course Guard.
- Claims that a tab switch proves distraction, measures attention, or diagnoses behavior.
- Cloud accounts, cloud sync, server history, remote analytics, remote AI, advertising, classroom monitoring, employer monitoring, or disciplinary use.
- Scores, grades, rankings, leaderboards, streak-loss mechanics, coins, shops, inventory, loot, clothing, pet health, or maintenance loops.
- Safari, Firefox, mobile browsers, and production claims outside desktop Google Chrome v1.
- Copying Tamagotchi or McDonald's branding, assets, characters, exact UI, or source code.
- Rebuilding the earlier camera-aware PWA journey as part of this Course Guard spec.
- Auto-starting guard, silently requesting permission, closing tabs, blocking the browser, or navigating to unrelated pages.

## Further Notes

- The project already has a GitHub Pages web-app URL and a first unpacked Manifest V3 extension build. The new bridge is the missing connection between them.
- The current extension prototype uses broad host access and internal extension messages; that is scaffolding, not the final permission or bridge contract.
- The current PWA repository and session machine are proven seams for local persistence and user journeys. The new Course Guard data model should be versioned rather than mixed into legacy camera terminology.
- The approved domain glossary in `CONTEXT.md` is the source of truth for copy and issue discussions.
- The implementation should preserve local-first behavior when the extension is unavailable: the web app may explain the connection state and show history/settings, but it must not claim an active guard.
- This specification is intended to be reviewed by the user before an implementation plan is written.
