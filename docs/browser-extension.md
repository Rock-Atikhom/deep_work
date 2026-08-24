# Deep Work Course Guard

Deep Work Course Guard is the browser-extension part of this project. It is designed for learners taking an online course in Chrome.

## What it does

1. Open the course lesson in a browser tab.
2. Open the extension and choose **Start guard**.
3. The extension remembers the course site for that guard session.
4. If the active tab moves to another website, the extension shows a local interruption overlay.
5. **Back to course** returns the active tab to the lesson.

There is no Pomodoro schedule. The guard ends only when the learner stops it.

The first slice compares the course site's origin, not page content. It does not read or upload the pages being visited. Guard state and the interruption count are stored in Chrome's local extension storage.

## Build the extension

From the repository root:

```sh
npm run extension:build
```

This creates `dist-extension/` with the Manifest V3 bundle.

## Connect the web app

The Learning Plaza web app connects through Chrome external messaging. Set the extension ID at
build or dev-server time; the app intentionally stays **Extension disconnected** when no ID is
configured.

```sh
VITE_COURSE_GUARD_EXTENSION_ID=<your-extension-id> npm run dev
```

The GitHub Pages workflow reads the repository variable `COURSE_GUARD_EXTENSION_ID` for the
published build. Use the stable installed extension ID in that variable, and use the separate ID
shown for an unpacked local extension during local development. The extension accepts messages only
from the published GitHub Pages origin and the approved Vite localhost origins.

## Load it in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the repository's `dist-extension/` directory.
5. Open an online course, click the extension icon, and choose **Start guard**.

The extension requires tab access and requests only the selected course-origin access when Course
Guard starts. It stores the active guard locally and removes that selected-origin access when the
guard stops. The extension does not read course page content.

## Verify the Plaza companion manually

For a full local check, build both surfaces and load the web app with the unpacked extension ID:

```sh
npm run build
npm run extension:build
VITE_COURSE_GUARD_EXTENSION_ID=<your-extension-id> npm run dev
```

Then verify this path in desktop Chrome:

1. Open `http://localhost:5173/#/plaza` and confirm the Learning Plaza, Focus Friend, destination cards, and **Start a focus session** action render.
2. Open **Course Guard**, enter an HTTP(S) course URL and a study goal, then confirm the extension status is connected before starting.
3. Start Course Guard and confirm Momo changes to focusing only after the extension confirms the start.
4. Switch the active tab to another origin. Confirm the Plaza-style interruption shows Momo, the course hostname, the return count, and **Back to course**.
5. Use **Back to course**. Confirm Chrome returns to the latest known in-course tab and URL, not a generic page.
6. Stop Course Guard from the web app or popup. Confirm the session appears in **Session Archive** with duration, returns, growth, and reward.
7. Open **Wardrobe & Plaza** and confirm the unlocked cosmetic can be equipped while locked items remain disabled.
8. Revoke the selected host permission while a guard session is active. Confirm the extension enters a recoverable permission-needed state and the archive records an incomplete session.
9. Restart the extension service worker from `chrome://extensions` and confirm the popup reconstructs the correct state.
10. Test a restricted browser page such as a Chrome internal URL. Confirm the extension fails safely without claiming protection or attempting an unsafe redirect.

The web browser acceptance tests cover the production plaza shell without Chrome APIs:

```sh
npx --yes playwright@1.62.0 test --config=tests/e2e
```
