# Deep Work Companion Design

Date: 2026-08-19

Status: Approved design awaiting written-spec review

## 1. Product summary

Deep Work Companion is a voluntary, private study-focus progressive web application for students using personal Windows or macOS computers. A student starts a timed study session, states a subject and goal, and may consent to local camera analysis. The application observes limited, visible signals that can indicate a possible attention shift:

- sustained downward gaze;
- sustained head-away posture; and
- sustained face absence.

These signals are not proof of mental distraction. The product must consistently use the phrase "possible distraction" or neutral "awareness event" language. It must never describe an event as proof of distraction, a disciplinary violation, or a medical conclusion.

When an observation persists beyond the selected sensitivity threshold, the application plays one adjustable sound and shows a supportive Gentle Reset. The student can return to studying, try a local quick-review question, or indicate that they are taking notes. The application records only a local event count, not images, landmarks, gaze traces, or a focus score.

The product supports personal growth without surveillance, punishment, competition, or shame.

## 2. Goals and non-goals

### 2.1 Goals

- Help a student notice possible attention shifts during a self-directed study session.
- Make camera participation explicit, reversible, and optional.
- Process camera frames locally and discard them immediately.
- Provide useful camera-free timer and learning features.
- Redirect attention through a non-blocking visual and sound prompt.
- Support local editable question decks, beginning with an SQL sample deck.
- Summarize sessions through facts and self-reflection rather than a productivity score.
- Add gentle gamification through permanent learning-garden progress.
- Work as an installable static PWA in current desktop Chrome and Edge on Windows and macOS.
- Remain useful offline after the application and vision assets have loaded successfully once.

### 2.2 Non-goals for the first release

- Proving whether a student is mentally focused or distracted.
- Monitoring a classroom, seminar, conference room, or multiple participants.
- Identifying a person or maintaining an identity profile.
- Recording video, taking photographs, collecting a training dataset, or training a custom model.
- Supporting disciplinary, employment, examination, medical, or accessibility assessment decisions.
- Running reliable camera awareness while the application window is hidden or minimized.
- Providing accounts, cloud synchronization, analytics, advertising, remote AI, or a backend service.
- Promising camera-awareness parity on mobile browsers, Safari, or Firefox.
- Copying source code from the unlicensed McDonald's Doomscroll Tracker repository.

## 3. Provenance and licensing

The implementation will be original and licensed under the MIT License.

Selected camera, MediaPipe, privacy, PWA, and test patterns may be adapted from the project owner's Smart Smile repository at `Rock-Atikhom/smile_detection`. The reused source commit must be recorded before extraction. Adapted code must remain small, auditable, and relevant to Deep Work Companion. Required dependency licenses and notices must be preserved in `THIRD_PARTY_NOTICES.md`.

The McDonald's Doomscroll Tracker at `strawluck/mcdonalds-application-doomscroller` has no declared software license. Deep Work Companion may credit it in the README as conceptual inspiration for a behavior-triggered intervention, but must not copy or redistribute its source code or assets.

## 4. Supported environment

The first supported environment is:

- latest stable Google Chrome on Windows and macOS;
- latest stable Microsoft Edge on Windows and macOS;
- a personal laptop or desktop camera;
- a visible Deep Work Companion window during camera-aware sessions; and
- HTTPS through GitHub Pages or localhost during development.

The interface is responsive. Smaller screens may use the timer, question decks, history, and legal pages, but the application must not claim equivalent gaze-detection accuracy on mobile devices.

If the page becomes hidden or the PWA is minimized, the study timer continues using elapsed-time timestamps, camera analysis pauses, and no awareness events are counted. The interface must state that awareness is paused until the window becomes visible.

## 5. Experience design

### 5.1 Welcome and privacy

The first screen explains:

- the voluntary educational purpose;
- the difference between an observable signal and mental attention;
- what camera analysis processes;
- what local data is saved;
- that frames and biometric outputs are not saved or uploaded;
- that the student can stop detection or delete local data at any time; and
- that the application can continue without a camera.

Primary actions are `Allow camera and continue` and `Continue without camera`. Camera permission must not be requested before the student chooses the camera action.

### 5.2 Session intention

The second setup step collects:

- subject;
- a concrete session goal;
- 25-minute, 50-minute, or custom duration;
- Gentle, Balanced, or Strict sensitivity;
- sound volume or silent visual mode; and
- a local quick-review deck, if one is available for the subject.

Advanced custom timing controls are hidden in Settings rather than shown in the daily setup flow.

### 5.3 Calibration

Camera-enabled sessions include a short calibration step. The application shows a temporary preview, explains camera positioning and lighting, confirms that exactly one usable face is present, and lets the student test the sound.

The student looks naturally at the study screen while the application derives an in-memory baseline for gaze and head pose. Calibration values expire when the session ends and are not persisted. The student can retry calibration, continue without camera, or cancel.

After calibration, the live preview disappears. The Focus Stage shows only a textual private-camera status.

### 5.4 Focus Stage

The Focus Stage contains:

- current subject and goal;
- remaining time;
- private-awareness status;
- current preset;
- awareness-event count;
- Pause Session; and
- End Session.

The interface must not show a live camera preview, gaze score, face landmarks, attention percentage, competitive score, or detailed observation timeline.

### 5.5 Gentle Reset

When the awareness policy emits an event, the application:

1. increments the in-memory session awareness count once;
2. plays one sound if sound is enabled;
3. shows the message "Your attention may have shifted";
4. states that no judgment is being made; and
5. offers `Continue studying`, `Try a quick review`, and `I'm taking notes`.

The reset is non-blocking. `Continue studying` returns to the focus state. `Try a quick review` opens one local question. `I'm taking notes` starts a temporary awareness pause and returns to the timer.

### 5.6 Quick review

The selected local deck provides one question. The review shows the answer and a short explanation immediately after submission. A student may return to study without answering. Review results contribute to the session summary but never prevent session completion.

The first release ships with an SQL sample deck. Students can create decks and import or export validated JSON. No online question generation is used.

### 5.7 Breaks and pauses

Camera analysis stops during manual pauses, notes pauses, and scheduled breaks. The application must make this inactive state visible. Break completion returns to the Focus Stage only after the student chooses to resume.

### 5.8 Reflection and gentle growth

The Reflection Card shows:

- focus time;
- awareness-event count;
- quick reviews attempted and correct;
- the subject and stated goal; and
- `Yes`, `Partly`, or `Not yet` in response to "Did you complete your goal?"

The application awards permanent learning-garden seeds for completed sessions. Garden progress never expires and is not tied to a daily streak. There are no leaderboards, streak-loss warnings, penalties, loot mechanics, or purchases. Botanical progress uses custom line artwork, not emoji.

## 6. Sensitivity and awareness policy

### 6.1 Observation contract

The vision adapter emits a temporary observation with this conceptual shape:

```ts
type VisionObservation = {
  capturedAtMs: number;
  faceCount: number;
  evidenceQuality: "reliable" | "unreliable";
  gazeDownScore: number;
  headAwayScore: number;
};
```

The adapter may use MediaPipe face landmarks, iris geometry, and head-pose transformation outputs to calculate normalized scores. Those raw outputs must not leave the worker contract or enter persistent storage.

Reliable evidence requires exactly one sufficiently visible face and usable lighting and landmark confidence. Unreliable evidence pauses dwell timers rather than producing an event.

### 6.2 Default presets

| Preset | Downward gaze or head away | Face absent | Recovery evidence | Alert cooldown | Notes pause |
| --- | ---: | ---: | ---: | ---: | ---: |
| Gentle | 10 seconds | 20 seconds | 2 seconds | 60 seconds | 5 minutes |
| Balanced | 5 seconds | 10 seconds | 2 seconds | 30 seconds | 5 minutes |
| Strict | 3 seconds | 5 seconds | 2 seconds | 15 seconds | 3 minutes |

Balanced is the default. Each dwell condition must be continuous. A short recovery resets its dwell timer. The policy emits only one event until reliable recovery evidence has occurred and the cooldown has elapsed.

Advanced Settings may allow threshold changes within safe documented ranges. A Reset Defaults action restores this table.

### 6.3 Face absence and multiple faces

Face absence is eligible only after a reliable single-face state has been established during the session. Initial camera startup and calibration do not count as face absence.

When more than one face appears, analysis pauses and the interface asks for a single participant. The application must not select, track, identify, or compare faces.

## 7. Architecture

Deep Work Companion is a static React and TypeScript PWA built with Vite and Tailwind CSS. It uses MediaPipe Tasks Vision, Vitest, Testing Library, and Playwright. It contains six isolated modules.

### 7.1 Session domain

A pure state machine owns:

- welcome;
- consent;
- setup;
- calibration;
- focus;
- awareness reset;
- quick review;
- manual and notes pauses;
- scheduled break;
- reflection; and
- completion.

State transitions depend on explicit domain events. Components do not coordinate the session through unrelated local booleans or timers.

### 7.2 Vision worker

MediaPipe inference runs in a dedicated Web Worker. At the worker-requested cadence, the main thread creates one `ImageBitmap` from the live video element and transfers ownership to the worker. The worker closes the bitmap in a `finally` block after inference and returns only a `VisionObservation`. No bitmap is copied to storage, retained for history, or reused across observations. The worker owns model loading, inference cadence, adaptive performance, and raw-output disposal.

The worker must expose explicit loading, ready, degraded, and failed states. UI controls and the timer remain responsive while the model loads or runs.

### 7.3 Awareness policy

A pure policy module consumes reliable observations and monotonic timestamps. It owns dwell timers, hysteresis, recovery requirements, preset thresholds, notes pauses, and cooldown behavior. It does not play sound, render UI, or access storage.

### 7.4 Intervention service

The intervention service translates an awareness-domain event into one sound request and one state-machine event. Duplicate worker messages must not produce duplicate alerts.

### 7.5 Learning content

The content module owns the versioned deck schema, validation, CRUD operations, question selection, answer evaluation, explanation display, and JSON import or export. Malformed decks are rejected with specific local errors.

### 7.6 Persistence

A versioned storage adapter uses IndexedDB for settings, decks, summaries, and garden state. UI and domain modules depend on an interface rather than direct IndexedDB calls. The adapter supports transactional deletion and JSON export.

## 8. Local data model

The application may persist:

- default duration, sensitivity, sound, and accessibility settings;
- local question decks;
- session identifier and local timestamps;
- subject and goal text;
- planned duration and measured focus time;
- awareness-event count;
- review attempt and correctness totals;
- `Yes`, `Partly`, or `Not yet` reflection; and
- total permanent garden seeds.

The application must never persist:

- camera frames or photographs;
- face landmarks, blendshapes, matrices, iris geometry, or calibration offsets;
- identity templates or cross-session face continuity data;
- frame-level or timestamped gaze and posture history;
- audio recordings;
- analytics identifiers; or
- remote account information.

`Delete My Data` removes every application-owned IndexedDB database, relevant Cache Storage entry, and local preference. The interface confirms what will be deleted before the action and confirms completion afterward.

## 9. Failure and recovery behavior

| Condition | Required behavior |
| --- | --- |
| Permission denied or revoked | Continue in timer-only mode and explain how to restore access. |
| Hidden or minimized page | Continue timer, pause awareness, count no events, and display paused status. |
| Model or worker failure | Retry once, then switch to timer-only mode without losing the session. |
| Camera missing, disconnected, or occupied | Offer Retry, Continue Without Camera, or End Session. |
| Poor lighting or positioning | Show neutral guidance and count no events while evidence is unreliable. |
| Multiple faces | Pause analysis and request one participant. |
| Low performance | Reduce inference frequency before disabling awareness. |
| Audio blocked | Preserve visual reset and expose the sound test. |
| Storage unavailable or full | Continue in memory and offer JSON export when possible. |
| Device sleep or clock jump | Recalculate elapsed time and ask whether to resume. |
| False positive | Let `I'm taking notes` dismiss the reset and pause awareness. |
| Unsupported browser | Explain the supported boundary and offer timer-only mode. |

Error messages must say what happened, whether awareness is active, what data is affected, and what the student can do next.

## 10. Visual design system

The approved direction is Calm Scholar with a Focus Stage layout and a Gentle Reset.

### 10.1 Typography

- Newsreader for reflective headings and timer numerals.
- IBM Plex Sans for controls, labels, forms, and explanatory text.
- Fonts are self-hosted for privacy and offline use.

### 10.2 Palette

The core palette uses warm paper, ink blue, botanical green, and mineral taupe. It must not use pure white, pure black, purple-and-black combinations, neon colors, rainbow coloring, harsh gradients, radial orbs, dot grids, or basic pastel palettes.

### 10.3 Geometry and motion

- Use square corners or a maximum 2px radius where needed for focus outlines or native control compatibility.
- Use borders, spacing, and type hierarchy instead of drop shadows.
- Do not use hover animations, shimmer, animated arrows, or decorative motion.
- Instant hover and focus state changes remain required for interaction clarity.
- Respect `prefers-reduced-motion` and keep essential state changes understandable without animation.

### 10.4 Composition

Do not use three feature cards in a row, bento grids, terminal-window decoration, fake testimonials, three-tier pricing, or contrarian X-versus-Y marketing formulas. The product itself is the demonstration. Pages must prioritize real session controls, real privacy explanations, and real local-data behavior.

Do not use emoji, sparkle icons, or Lucide icons. Use text, semantic HTML, simple geometric marks, and original botanical line artwork where an illustration adds meaning.

### 10.5 Loading

Use static rectangular skeleton blocks while local vision assets load. Skeletons must not shimmer, glow, pulse, or use animated gradients. A textual loading status and recoverable error replace the skeleton if loading exceeds the expected window.

## 11. Accessibility

The application must provide:

- full keyboard operation;
- logical heading and landmark structure;
- visible focus indicators;
- programmatic labels and status announcements;
- focus trapping and restoration for the Gentle Reset dialog;
- sufficient text and control contrast;
- meaning that does not depend on color alone;
- reduced-motion support;
- adjustable sound, mute, and visual-only operation;
- timer-only use without camera consent; and
- touch targets and layouts that remain usable at supported zoom levels.

The timer must not announce every second to assistive technology. Significant state changes, awareness pauses, alerts, breaks, and completion are announced politely and without repeated interruption.

## 12. Privacy Policy and Terms of Use

The repository and deployed application include readable, versioned Privacy Policy and Terms of Use pages.

The Privacy Policy explains:

- local camera processing;
- exact persistent-data categories;
- prohibited camera and biometric storage;
- browser permissions;
- offline caching;
- export and deletion;
- the absence of accounts, analytics, advertising, and remote AI;
- visible-window limitations; and
- how policy changes are dated.

The Terms of Use explain:

- voluntary participation;
- educational self-awareness purpose;
- non-medical and non-disciplinary boundaries;
- accuracy and false-positive limitations;
- prohibition on covert or group surveillance;
- acceptable use;
- third-party software notices;
- warranty limitations; and
- additional consent responsibility when a school deploys the tool for minors.

Legal pages must be linked from Welcome, Settings, and the persistent footer. They are part of the acceptance tests rather than decorative placeholders.

## 13. Testing strategy

### 13.1 Unit tests

Unit tests cover:

- every session-state transition;
- pause, break, sleep, and completion timing;
- preset dwell, recovery, and cooldown behavior with fake monotonic time;
- unreliable evidence and multiple-face suppression;
- duplicate observation and alert suppression;
- deck validation and scoring;
- garden awards; and
- storage migrations and deletion.

### 13.2 Component tests

Testing Library covers consent, camera-free mode, setup validation, calibration states, Focus Stage controls, Gentle Reset actions, sound controls, static skeletons, deck errors, Reflection Card, keyboard behavior, and accessible names.

### 13.3 Vision contract tests

Deterministic observation fixtures test the worker-to-policy boundary without including face images or biometric fixtures. Runtime smoke validation separately verifies that the pinned MediaPipe release loads and emits a valid observation contract.

### 13.4 End-to-end tests

Playwright covers:

- first visit and policy access;
- camera-free session completion;
- mocked reliable observation flow through Gentle Reset;
- permission denial and recovery;
- hidden-window awareness pause;
- worker failure fallback;
- offline reload after initial caching;
- deck import and quick review;
- local history and garden progress;
- JSON export;
- Delete My Data; and
- GitHub Pages base-path behavior.

### 13.5 Real-device validation

A documented matrix covers current Chrome and Edge on Windows and macOS. Manual cases include camera permission changes, poor lighting, face absence, head turn, downward gaze, multiple faces, minimized window, device sleep, audio mute, and low-performance fallback.

### 13.6 Continuous integration

Every deploy requires formatting, linting, type checking, unit tests, component tests, runtime-manifest integrity, Playwright tests, production build, offline checks, and GitHub Pages smoke validation.

## 14. Performance expectations

- The timer and controls remain responsive while inference runs.
- The vision worker adapts inference cadence rather than saturating the device.
- A supported desktop should reach a stable observation cadence sufficient for the shortest 3-second preset threshold.
- Model loading exposes progress through static skeletons and text.
- Model failure never blocks timer-only use.
- Production assets are pinned, self-hosted, cached, and verified through a generated manifest.

Exact model-load and inference budgets will be recorded during the first supported-device benchmark and then enforced in the validation suite. Product behavior, not a synthetic maximum frame rate, determines acceptance.

## 15. Repository and deployment

The repository remains a single focused application:

```text
src/
  app/
  session/
  vision/
  awareness/
  content/
  storage/
  ui/
public/
  vision/
docs/
  legal/
  superpowers/specs/
tests/
.github/workflows/
```

GitHub Actions builds and deploys the exact tested static bundle to GitHub Pages under `/deep_work/`. The service worker caches the shell, self-hosted fonts, sample deck, and pinned vision assets after a successful first load. There is no backend.

The README includes:

- live product link;
- educational purpose and limitations;
- supported browsers;
- camera and local-data explanation;
- development and validation commands;
- real demonstration instructions;
- deployment details;
- provenance and license information; and
- links to the Privacy Policy, Terms of Use, architecture, and validation evidence.

## 16. First-release acceptance criteria

The first release is acceptable when:

1. A student can start a 25-minute, 50-minute, or custom session with a subject and goal.
2. The student can explicitly allow the camera or complete the session without it.
3. Camera frames are processed locally and no prohibited camera or biometric data reaches persistent storage or a network endpoint.
4. Supported devices can distinguish reliable single-face evidence, sustained downward gaze, sustained head-away posture, and face absence well enough to exercise all three approved presets.
5. Dwell, recovery, and cooldown rules prevent transient or repeated alert spam.
6. Gentle Reset provides sound and visual feedback plus all three recovery choices.
7. Local quick review works with the SQL sample deck and validated custom decks.
8. Session summaries, reflections, awareness counts, and permanent garden progress persist locally.
9. Hidden, failed, denied, offline, multi-face, low-quality, storage, and audio states recover according to this design.
10. Privacy Policy, Terms of Use, export, and Delete My Data are complete and tested.
11. The application passes automated quality gates and the real-device validation matrix.
12. The production PWA installs and runs from GitHub Pages in supported Chrome and Edge environments.

## 17. Deferred work

The following work requires a future design cycle:

- Chromium document picture-in-picture or an always-visible companion window;
- Safari and Firefox camera-awareness support;
- mobile camera-awareness support;
- optional school-managed deck distribution;
- cross-device synchronization;
- additional sample subjects;
- empirical preset tuning across a larger voluntary participant pool; and
- richer garden artwork that preserves the non-competitive rules.
