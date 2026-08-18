# Deep Work Companion v0.1 implementation spec

Status: ready for implementation

This specification turns the approved Deep Work Companion design and implementation plan into one tracker-ready contract. It is intentionally behavior-first: a student should be able to understand what the product does, why it does it, and what stays private without reading implementation details.

## Problem Statement

Students often open a laptop to study and then drift into unrelated browsing, phone use, or passive screen time. A useful intervention should help a student notice a possible attention shift while preserving agency and dignity. It must work for an individual student studying at a desk, in a seminar, at a conference, or on site where the student has a personal computer and has chosen to participate.

The two reference projects supplied for ideation establish useful ingredients: a doom-scrolling interruption pattern and a local camera-based smile/face-detection pattern. They do not, by themselves, define an education-safe focus product. Deep Work Companion must make the distinction explicit:

- An `Observation` is only a temporary local description of visible face presence, downward gaze, or head-away posture.
- `Reliable Evidence` means that enough visible information persisted to inform an awareness decision; it is not a measurement of a student’s mind.
- An `Awareness Event` is a supportive prompt after a threshold; it is not a violation, grade, diagnosis, or proof of mental distraction.

The product also needs a camera-free path. Camera access can be unavailable, inappropriate, or unwanted, and a student must never be forced to provide biometric-like signals in order to study. Local processing, explicit consent, visible camera state, deletion controls, and plain-language legal documentation are core product behavior rather than polish.

## Solution

Deep Work Companion is a voluntary, local-first study-focus PWA for students using a personal Windows or macOS laptop or desktop. A student starts a `Focus Session` by choosing a subject, a goal, a duration, a `Sensitivity Preset`, a sound preference, and optionally a local `Question Deck`.

Every Focus Session can run as a `Timer-Only Session`. If the student explicitly consents, it can instead run as a `Camera-Aware Session`, where the visible window uses local MediaPipe analysis to detect only sustained patterns relevant to an awareness prompt. No camera frame, image, landmark, blendshape, iris, calibration sample, gaze timeline, or raw vision output is uploaded or retained. The camera preview is never shown during a session.

The primary intervention is a non-blocking `Gentle Reset`: one optional sound and a calm dialog saying that attention may have shifted, with actions to continue studying, try one `Quick Review`, or begin a `Notes Pause`. The student remains in control of the timer and can pause or end the session at any time.

At the end, a `Reflection Card` records the session’s learning-oriented outcome. A completed session grows the student’s private `Learning Garden`; it does not create a streak, leaderboard, penalty, or productivity score. All durable records remain on the device and can be deleted from an always-visible data-control surface.

## User Stories

### Student intent, consent, and privacy

1. As a student, I want to state my subject before starting so that the session has a clear learning context rather than becoming an unexplained timer.
2. As a student, I want to state one concrete goal in my own words so that the end-of-session reflection can refer to what I intended to learn.
3. As a student, I want to choose 25 minutes, 50 minutes, or a custom duration so that the product fits a short review, a lecture block, or a longer study period.
4. As a student, I want to start a Timer-Only Session without camera permission so that the core learning workflow works even when I do not want camera analysis.
5. As a student, I want the product to explain Camera-Aware Session consent before the browser prompt appears so that I understand what is analyzed, where it happens, and what is not saved.
6. As a student, I want camera consent to be opt-in for each session or clearly controlled by a visible preference so that a previous choice never silently becomes ongoing observation.
7. As a student, I want to see the private-camera status at a glance during a Camera-Aware Session so that I can tell whether camera analysis is active, paused, unavailable, or not selected.
8. As a student, I want to revoke camera analysis during a session without ending the timer so that I can continue learning if my context changes.
9. As a student, I want to decline camera access and receive a complete Timer-Only Session instead of a dead end or a guilt-inducing message.
10. As a student, I want a plain-language Privacy Policy to explain local processing, retained records, deletion, and browser permissions before I choose to participate.
11. As a student, I want Terms that explain voluntary use and educational boundaries so that I am not led to treat the product as an exam proctor, health tool, or disciplinary system.
12. As a student, I want a visible Delete My Data action that removes durable local records and resets the garden without contacting a server.

### Session setup and focus state

13. As a student, I want the setup screen to show the selected subject, goal, duration, preset, and sound preference together so that I can review the session contract before starting.
14. As a student, I want a short camera calibration preview only when I have consented so that I can learn how to position myself without storing calibration imagery.
15. As a student, I want calibration feedback to say when no face, multiple faces, or insufficient visibility prevents Reliable Evidence so that the product does not pretend to know more than it can see.
16. As a student, I want calibration to finish and disappear before the Focus Stage so that I am not distracted by a live camera view.
17. As a student, I want the Focus Stage to show my goal, remaining timer, camera state, preset, awareness count, pause control, and end control so that the useful state is visible without a dashboard wall.
18. As a student, I want the timer to keep counting while the browser window is minimized or hidden, while camera awareness pauses, so that the product does not infer visibility when it cannot reliably observe the screen context.
19. As a student, I want an explicit pause control for the whole Focus Session so that taking a real break does not look like an Awareness Event.
20. As a student, I want ending early to be allowed and reflected honestly so that the product respects my agency instead of locking me in.
21. As a student, I want a clear recovery path after a refresh or tab interruption so that I can either resume a still-valid session or end it safely without duplicate records.

### Local observation and sensitivity

22. As a student, I want the product to use only coarse visible signals such as face absence, sustained downward gaze, and head-away posture so that it supports awareness without presenting a gaze score or mental-state label.
23. As a student, I want the product to wait for persistence before creating an Awareness Event so that a blink, stretch, glance at paper, or momentary detector jitter does not interrupt my study.
24. As a student, I want recovery time after I return to a reliable position so that the prompt does not fire repeatedly while I am settling back in.
25. As a student, I want a cooldown after an Awareness Event so that the product does not nag me continuously.
26. As a student, I want the Gentle preset to be forgiving for reading, note-taking, and imperfect camera placement.
27. As a student, I want the Balanced preset to provide a practical default for ordinary desk study.
28. As a student, I want the Strict preset to use shorter persistence thresholds when I explicitly want a more attentive nudge.
29. As a student, I want the selected preset and its meaning described in ordinary language so that Gentle, Balanced, and Strict are timing policies rather than judgments about my discipline.
30. As a student, I want multiple faces in view to pause camera awareness rather than attribute another person’s posture to me.
31. As a student, I want no face or poor visibility to produce an unavailable state rather than a false claim that I am distracted.
32. As a student, I want a Notes Pause that pauses camera awareness for a short, selected period when I am reading or writing away from the screen.
33. As a student, I want Notes Pause to be available from the Gentle Reset and Focus Stage so that paper notes and off-screen work are first-class study behaviors.

### Gentle Reset and sound

34. As a student, I want the Gentle Reset to be non-blocking so that I can dismiss it and keep studying immediately.
35. As a student, I want the prompt to use neutral language such as “Your attention may have shifted” so that it invites a return rather than assigning blame.
36. As a student, I want one optional sound to accompany the prompt so that I can notice it without needing to watch the page.
37. As a student, I want sound preferences for off, soft, and standard volume so that the intervention fits a quiet seminar or a private desk.
38. As a student, I want the sound to be generated locally and stopped when I disable sound so that no audio service or external request is needed.
39. As a student, I want the Gentle Reset to offer Continue studying, Try quick review, and I’m taking notes so that the next action matches my situation.
40. As a student, I want to dismiss or complete a Gentle Reset without losing timer state, goal, preset, or the current awareness count.
41. As a student, I want the awareness count to be visible as a neutral session fact and not translated into a score, grade, streak, or punishment.

### Learning support

42. As a student, I want to opt into a Question Deck for the subject before a session so that a reset can help me reconnect with learning rather than merely interrupt me.
43. As a student, I want to create, edit, import, and remove questions locally so that the deck reflects my own course material.
44. As a student, I want each question to support an optional explanation or answer note so that Quick Review can reinforce understanding after I respond.
45. As a student, I want Quick Review to present one question at a time and remain optional so that it never becomes a mandatory quiz.
46. As a student, I want Quick Review to work with no network connection so that the learning support does not depend on an online AI service.
47. As a student, I want to skip Quick Review when the prompt is not appropriate, with no penalty to my session or garden.
48. As a student, I want the Reflection Card to show focus time, awareness count, Quick Review outcome if used, and a Yes/Partly/Not yet goal reflection so that I can learn from the session without being ranked.

### Learning Garden and data control

49. As a student, I want every completed Focus Session to add a small botanical growth record so that progress feels cumulative and personal.
50. As a student, I want the Learning Garden to remain non-competitive and permanent so that missing a day does not erase progress or create pressure.
51. As a student, I want to review prior session summaries without seeing camera imagery, face landmarks, or a gaze timeline.
52. As a student, I want to export or inspect the durable learning records in a human-readable form so that I can understand what the product keeps locally.
53. As a student, I want Delete My Data to remove sessions, garden growth, question decks, and preferences together, with a confirmation that names the records affected.
54. As a student, I want the product to remain useful after deletion so that clearing local history does not disable future Timer-Only Sessions.

### Accessibility, recovery, and context

55. As a student with hearing limitations, I want every sound prompt to have a visible equivalent so that awareness does not depend on audio.
56. As a student with vision or motor limitations, I want keyboard access, visible focus, readable contrast, semantic headings, and screen-reader labels for every control.
57. As a student in a quiet seminar, I want sound to remain off and prompts to be calm and compact so that participation does not disturb others.
58. As a student on site or at a conference, I want the product to tolerate camera denial, temporary device changes, and unavailable network access through the Timer-Only Session and offline bundle.
59. As a student, I want camera startup errors, permission revocation, model-load errors, and unsupported browser conditions to produce actionable recovery choices rather than a blank screen.
60. As a student, I want the product to tell me when the visible window is required for camera awareness so that I understand why a minimized or hidden window pauses analysis.
61. As a student, I want all supported behavior to be tested on the production build, not only in a development server, so that an installed GitHub Pages PWA behaves as promised.
62. As a student, I want the product to make no requests to analytics, remote vision, remote AI, or image storage endpoints so that the private promise is technically observable.

## Implementation Decisions

### Product boundaries and state

1. Model the user journey with a pure session state machine covering setup, consent, calibration, active focus, Notes Pause, Gentle Reset, Quick Review, reflection, completed, ended, and recoverable error states. Transitions must be explicit and deterministic.
2. Keep Timer-Only Session behavior independent from camera lifecycle behavior. Camera denial, unsupported APIs, model failure, or worker failure must never prevent the timer and reflection flow.
3. Use a pure awareness policy that accepts normalized observation inputs and a clock, then returns whether evidence is accumulating, recovering, cooling down, paused, unavailable, or ready to create an Awareness Event. The policy owns thresholds; UI components do not.
4. Define the initial Sensitivity Presets as follows:
   - Gentle: sustained downward/head-away evidence 10 seconds, face absence 20 seconds, recovery 2 seconds, cooldown 60 seconds, Notes Pause 5 minutes.
   - Balanced: sustained downward/head-away evidence 5 seconds, face absence 10 seconds, recovery 2 seconds, cooldown 30 seconds, Notes Pause 5 minutes.
   - Strict: sustained downward/head-away evidence 3 seconds, face absence 5 seconds, recovery 2 seconds, cooldown 15 seconds, Notes Pause 3 minutes.
5. Treat a single visible face as the only eligible subject. Treat multiple faces, no face, stale frames, low-confidence output, worker disconnect, and hidden-window state as unavailable evidence, never as distraction evidence.
6. Keep the Focus Stage deliberately sparse: goal, timer, camera state, preset, awareness count, pause, end, and intervention controls. Do not expose live camera preview, gaze scores, landmarks, confidence percentages, or an attention timeline.

### Camera and vision boundary

7. Request camera permission only after a consent explanation and only for a Camera-Aware Session. Display a clear state for not selected, requesting, active, paused, denied, unavailable, and ended.
8. Use a dedicated camera lifecycle abstraction that owns stream acquisition, track cleanup, permission loss, visibility changes, and shutdown. The session state machine receives events rather than manipulating media tracks directly.
9. Send short-lived video data to a local vision worker only while the camera-aware state is active and the visible window is eligible. Dispose frame resources promptly after processing.
10. Keep the worker protocol narrow: it receives a frame and returns normalized coarse observations plus a model/runtime status. It must never return or persist raw landmarks, images, embeddings, or a longitudinal gaze record.
11. Keep calibration in memory only, use it to validate visibility and one-person conditions, and discard it when calibration ends or the session ends.
12. Pin and integrity-check the offline vision runtime and verify that the service worker serves it from the local bundle. The application must show a recoverable error if the runtime cannot be loaded rather than silently falling back to an unverified network asset.

### Local persistence and learning content

13. Use IndexedDB behind a repository boundary. Persist only session summaries, reflection values, Awareness Event counts, Learning Garden growth records, Question Deck content, and user preferences needed for the experience.
14. Never persist frames, images, raw landmarks, blendshapes, iris data, calibration imagery, per-frame observations, gaze timelines, or worker diagnostics that could reconstruct them.
15. Make repository deletion transactional from the user’s perspective: enumerate the durable categories, confirm once, delete them, and render an empty garden/history state. A failed deletion must be visible and retryable.
16. Validate imported Question Decks against a versioned local schema. Reject malformed records with a helpful message, keep imports offline, and keep question content editable after import.
17. Keep Quick Review deterministic and local. Select one question from the active Question Deck, capture only the student’s optional result category, and never call a remote generator or assessment service.

### Intervention, sound, and reflection

18. Create an Awareness Event only when the pure policy reports threshold completion. Debounce the event at the policy layer and persist only the resulting count in the session summary.
19. Render Gentle Reset as a non-blocking dialog or sheet with the three approved actions. The action “I’m taking notes” starts Notes Pause; it does not mark a violation or alter the goal.
20. Implement sound with local Web Audio primitives, respect the selected sound preference, stop cleanly on unmount or preference changes, and provide a visual equivalent for every sound.
21. End a session with a Reflection Card. Store the goal reflection, optional Quick Review result, focus duration, Awareness Event count, and completion/early-end status. Never derive a score or ranking.
22. Grow the Learning Garden from completed session summaries using stable local rules. Garden growth must be reproducible from stored summary data and must not depend on a streak or network timestamp service.

### Delivery, visual system, and legal surface

23. Ship a static React/TypeScript PWA that works from the GitHub Pages base path `/deep_work/`, with the exact production build used for verification.
24. Target current desktop Chrome and Edge on Windows and macOS first. The supported camera-aware surface requires a visible browser window; Timer-Only Session remains the fallback when camera support is absent. Mobile, Safari, and Firefox camera awareness are outside v0.1 support.
25. Provide offline application shell, question decks, session state, and the verified vision runtime after the first successful load. Show a clear offline/asset failure state when an essential local asset is unavailable.
26. Use a flat, editorial visual system: warm paper background, ink blue text, botanical green action color, mineral taupe secondary surfaces, sharp 0–2px corners, Newsreader for display type, and IBM Plex Sans for interface text. Use custom botanical linework instead of icon-library decoration.
27. Preserve the approved anti-pattern constraints: no harsh gradients, Lucide icons, pure white canvas, rainbow coloring, drop shadows, three feature cards in a row, emojis, em dashes, Inter/Geist/Space Grotesk, colored left stripes, fake testimonials, bento grids, terminal-window framing, “It’s not X, it’s Y” copy, checkmark bullets, pricing tiers, fake product demos, no skeleton loaders, radial orbs, dot grids, sparkle icons, animated arrows, neon colors, basic pastel treatment, or hover animations used as decoration.
28. Include visible Privacy Policy, Terms, and Delete My Data controls in the product shell. Legal copy must match actual local processing, retention, consent, deletion, and educational boundaries.
29. Preserve the MIT licensing and attribution obligations of any reused owned Smart Smile modules. Reuse only selected camera/session patterns after adapting them to this product’s privacy contract; do not copy unlicensed code or brand assets from the McDonald’s reference project.

## Testing Decisions

The highest-value seam is a controller-level integration seam that injects five boundaries: a camera session, a vision client, a local repository, a local Question Deck service, and a sound service. The controller consumes events and emits rendered state/actions. This seam allows end-to-end behavior to be tested without a real camera or browser permission while preserving the same contracts used by the production adapters.

### Pure behavior tests

- Test every session state transition, including consent denial, camera revocation, pause/resume, early end, refresh recovery, Quick Review, Notes Pause, reflection, deletion, and error recovery.
- Test the awareness policy with virtual time for all three presets, threshold boundaries, recovery, cooldown, multiple faces, no face, stale frames, low confidence, hidden-window pause, and observation changes during Notes Pause.
- Test that the policy cannot emit an Awareness Event from a single transient observation and cannot emit a second event during cooldown.
- Test deterministic Learning Garden growth from session summaries and deterministic Question Deck selection rules.
- Test schema validation for valid decks, missing fields, unsupported versions, duplicate identifiers, malformed imports, and empty decks.

### Component and controller behavior

- Verify setup renders the consent explanation before the browser permission request.
- Verify Timer-Only Session starts and completes when camera APIs, model runtime, or sound are unavailable.
- Verify Camera-Aware Session shows active/private status, never renders a live preview in Focus Stage, and cleanly stops all tracks on end, revoke, navigation, and error.
- Verify multiple faces and unavailable evidence pause awareness without incrementing the count.
- Verify each Awareness Event produces one visible Gentle Reset and at most one configured sound.
- Verify Continue studying, Try quick review, and I’m taking notes preserve the intended timer and policy state.
- Verify Delete My Data clears all durable categories and leaves the app usable for a new Timer-Only Session.
- Verify keyboard navigation, focus order, dialog semantics, reduced-motion behavior, visible labels, contrast, and screen-reader announcements.

### Worker, camera, and privacy contract tests

- Test the camera lifecycle against mocked permission states, track-ended events, visibility changes, unsupported APIs, and repeated start/stop calls.
- Test the worker protocol with synthetic normalized observations and malformed messages; reject unknown payloads and ensure frame resources are disposed.
- Test that no repository write receives frame bytes, images, landmarks, blendshapes, iris data, calibration samples, per-frame observations, or gaze timelines.
- Test service-worker caching and integrity failure behavior for the application shell and vision runtime.

### Production and manual verification

- Build the production bundle and serve it from the `/deep_work/` base path, then exercise the same user stories in a browser automation suite.
- Inspect browser network logs during camera-aware and timer-only flows; expect no analytics, remote vision, remote AI, frame upload, or image-storage request.
- Run an offline reload after the initial asset cache is populated; verify timer-only flow, a cached Question Deck, and the cached vision runtime behavior.
- Test current desktop Chrome and Edge on Windows and macOS with camera allowed, camera denied, no camera, multiple faces, low light, glasses, note-taking posture, and window minimize/restore.
- Manually verify sound-off, soft, and standard settings in a quiet room and verify visible equivalents for every audio cue.
- Run an accessibility audit on setup, consent, Focus Stage, Gentle Reset, Quick Review, reflection, legal pages, and deletion confirmation.
- Verify legal text, deletion confirmation, MIT notices, and the absence of prohibited visual motifs before release.

### Prior art to adapt and re-test

The owned Smart Smile work provides useful prior art for a camera lifecycle, face-frame pump, worker/runtime separation, manifest and integrity handling, service-worker vision caching, and React test organization. Adapt these patterns only behind the boundaries above and re-test them against the Deep Work Companion privacy contract. The McDonald’s doom-scroller project is conceptual inspiration for interruption timing only; it is not a source of code, branding, or claims.

## Out of Scope

- Classroom, employer, exam, or group surveillance; teacher dashboards; identity recognition; attendance; grading; disciplinary records; or proctoring.
- Any claim that an Observation or Awareness Event proves mental distraction, intent, dishonesty, disability, or learning quality.
- Cloud storage, analytics, remote vision, remote AI generation, account sync, social sharing, advertising, or cross-device profiles.
- Retaining camera frames, screenshots, landmarks, embeddings, iris information, calibration imagery, per-frame observations, or gaze timelines.
- Mobile camera awareness, Safari camera awareness, Firefox camera awareness, background-tab camera awareness, or reliable camera awareness while the window is hidden/minimized.
- Phone/app blocking, browser-wide website blocking, operating-system controls, or automatic enforcement outside the product window.
- Competitive streaks, leaderboards, points, productivity scores, punitive lockouts, mandatory quizzes, or manipulative notifications.
- Medical, psychological, accessibility, or academic-performance diagnosis.
- Automatic online Question Deck generation or remote assessment.
- Rich collaboration, teacher authoring portals, institutional administration, or classroom sharing.
- Copying unlicensed code, trademarks, illustrations, or branded content from either reference repository.

## Further Notes

- Approved design: `docs/superpowers/specs/2026-08-19-deep-work-companion-design.md`.
- Approved implementation plan: `docs/superpowers/plans/2026-08-19-deep-work-companion.md`.
- Product vocabulary: `CONTEXT.md`.
- Execution map: [Wayfinder map #1](https://github.com/Rock-Atikhom/deep_work/issues/1).
- The work is intentionally scoped for a rapid prototype submission while retaining a credible privacy, consent, and testing story. The eight-hour deadline favors a thin vertical slice: setup, Timer-Only Session, consent-safe camera path, one awareness policy, one Gentle Reset, one local Question Deck, reflection, garden, deletion, and production verification.
- The repository is currently documentation-first. This spec does not claim that the application has been implemented; it is the contract an implementation agent should follow.
- The chosen test seam is the injected controller boundary described above. It is the expected seam for implementation and review, not a request for a second design interview.
