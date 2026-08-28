# Deep Work Course Guard

A local-first browser extension and Learning Plaza companion that helps learners return to their online course when they leave the course website.

Deep Work Course Guard is a gentle, learner-directed boundary—not a Pomodoro timer, surveillance tool, or productivity score.

## What it does

The core loop is:

```text
Course tab → Start guard → Leave the course → Return interruption → Back to course
```

The web app is the full **Learning Plaza** dashboard. The Chrome extension is the compact pocket companion and remains authoritative for active Course Guard state.

### Product surfaces

- **Learning Plaza** — the friendly town hub and companion status view.
- **Course Guard** — choose a course website, see connection status, and start or stop a guard session.
- **Session Archive** — review local completed or incomplete session summaries.
- **Wardrobe & Plaza** — equip locally unlocked companion cosmetics.
- **Town Hall** — manage connection help, privacy, local data, and reduced motion.
- **Extension popup** — a compact status check-in with one primary action.
- **Return interruption** — a local supportive prompt with a clear **Back to course** action.

## How it works

```text
Learner → Learning Plaza web app → secure allowlisted bridge → Course Guard extension → browser tab origin
```

1. The learner selects a course website and starts Course Guard.
2. The extension requests access to the selected course origin only after explicit consent.
3. The extension compares the active tab's website origin; it does not read page contents.
4. Leaving that origin produces a **Distraction Signal** and a local **Return Interruption**.
5. **Back to course** returns to the latest known in-course tab and URL, falling back to the setup URL when necessary.
6. Stopping the guard saves a local Session History Summary.

The extension is authoritative for live guard state. The web app does not show a session as active until the extension confirms it. Permission denial or revocation leaves the system off or stops it safely instead of presenting a false active state.

## Privacy and safety

- No page-content reading.
- No uploaded browsing history.
- No camera frames transmitted through the Course Guard bridge.
- Explicit course-origin permission at guard start.
- Local session history and companion progress.
- Safe handling of permission denial and permission revocation.
- No leaderboard, streak pressure, punishment, or attention score.

The project uses an origin-based guard: leaving the selected course website is a signal to invite the learner back, not proof of distraction. The Focus Friend expresses status and progress; it does not judge, diagnose, or measure attention.

The existing camera-aware and timer-only learning-history surfaces are local PWA features described in [`CONTEXT.md`](CONTEXT.md); they are separate from the primary Course Guard extension vocabulary.

## Local development

### Requirements

- Node.js `>=22.22.2 <23`
- npm `10.9.7`

Install dependencies and start the web app:

```sh
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. The app intentionally shows **Extension disconnected** until a permitted extension ID is configured.

Build and preview the web app:

```sh
npm run build
npm run preview
```

## Chrome extension

Build the Manifest V3 extension:

```sh
npm run extension:build
```

Then in Chrome:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the repository's `dist-extension/` directory.
5. Open an online course, click the extension icon, and choose **Start guard**.

To connect an unpacked local extension to the web app, use the extension ID shown by Chrome:

```sh
VITE_COURSE_GUARD_EXTENSION_ID=<your-extension-id> npm run dev
```

The extension accepts web-app messages only from the published project origin and approved local development origins. It requests only the selected course-origin access needed for the active guard.

For the complete bridge and manual verification guide, see [`docs/browser-extension.md`](docs/browser-extension.md).

## Verification

Run the complete local checks:

```sh
npm test
npm run format:check
npm run lint
npm run typecheck
npm run vision:manifest:check
npm run build
npm run extension:build
npx --yes playwright@1.62.0 test --config=tests/e2e
```

## Project poster

The repository includes an A1 portrait project poster draft based on the Learning Plaza design system:

- Editable source: [`public/poster/`](public/poster/)
- Render command: `npm run poster:render`
- Generated output: `/tmp/learning-plaza-poster/`

The renderer creates a PDF and PNG preview. Generated files are intentionally kept outside version control.

## Repository map

- [`CONTEXT.md`](CONTEXT.md) — product language, guard behavior, privacy boundaries, and domain terms.
- [`DESIGN.md`](DESIGN.md) — Learning Plaza visual identity and interaction principles.
- [`docs/browser-extension.md`](docs/browser-extension.md) — extension build, loading, connection, and manual verification guide.
- [`public/poster/`](public/poster/) — A1 project poster source.
- [`LICENSE`](LICENSE) — project license.
- [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) — third-party notices.

## Project principles

- Keep Course Guard learner-directed and supportive.
- Keep the extension authoritative for live guard state.
- Keep approved state and session data local to the browser.
- Preserve keyboard access, visible focus, reduced-motion support, and honest connection states.
- Use original Focus Friend and Learning Plaza visuals.
- Do not add surveillance language, attention scoring, punishment loops, social comparison, or unsupported product claims.

Contributions should preserve these boundaries and include verification evidence for behavior or documentation changes.

## License and notices

This project is distributed under the [`LICENSE`](LICENSE). See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for dependency and asset notices.
