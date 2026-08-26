# Ticket #29 — Chrome Desktop Release Acceptance Checklist

Parent spec: [#22](https://github.com/Rock-Atikhom/deep_work/issues/22) · Ticket: [#29](https://github.com/Rock-Atikhom/deep_work/issues/29)

## Part A — Automated checks (recorded 2026-08-26 on `main` @ d5617ff)

| Check | Result |
| --- | --- |
| `npm run format:check` | PASS |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` (47 files / 206 tests) | PASS |
| `npm run build` | PASS |
| `npm run extension:build` (`dist-extension/`) | PASS |
| `npm run vision:manifest:check` | PASS |
| Playwright E2E (`tests/e2e`, 16 tests) | PASS |

## Part B — Environment setup (manual, once)

1. `git pull origin main && npm ci && npm run build && npm run extension:build`
2. `chrome://extensions` → Developer mode → **Load unpacked** → select `dist-extension/`
3. Copy the unpacked extension ID from its card.
4. Run the web app locally with that ID:
   `VITE_COURSE_GUARD_EXTENSION_ID=<unpacked-id> npm run dev`
   → open `http://localhost:5173/#/plaza`
5. Confirm the repo variable `COURSE_GUARD_EXTENSION_ID` holds the *production* extension ID for the GitHub Pages deployment (Settings → Secrets and variables → Actions → Variables).

> Note: production and unpacked builds have **different** extension IDs by design. Record both below.

- Production extension ID: `___________`
- Unpacked dev extension ID: `___________`

## Part C — Manual Chrome scenarios

Tick each box and attach a screenshot (or short note) per scenario to this ticket.

### Connection & handshake
- [ ] **Extension missing**: open the web app with no extension loaded → Plaza shows **Extension disconnected**; Course Guard start stays disabled; Town Hall shows recovery steps. No false "Guarding course".
- [ ] **Bridge handshake**: load the unpacked extension, choose Town Hall → **Check again** → status flips to **Extension connected** without a page reload.

### Permission lifecycle
- [ ] **Grant**: enter a course URL, Start Course Guard → Chrome origin prompt appears for only the course origin → accept → status becomes **Guarding course** in both app and popup.
- [ ] **Deny**: repeat with a second course URL but deny → guard stays off; copy explains access is needed to detect leaving; no partial session saved.
- [ ] **Revoke mid-session**: while guarding, remove the site permission from the address-bar icon → guard stops safely; session is recorded as **Incomplete**; no false active state.

### Interruption loop
- [ ] **Same-origin tabs**: with guard on, switch between two tabs of the same course origin → no interruption fires.
- [ ] **Cross-origin interruption**: switch to another origin → full-page overlay appears with Focus Friend reaction, one supportive message, exactly **one** "Back to course" action; page content is never read or rendered.
- [ ] **Latest-URL return**: navigate within the course to a deep URL, distract yourself, use Back to course → returns to the latest in-course tab/URL.
- [ ] **Fallback return**: close the in-course tab first, then get interrupted and return → falls back to the setup Course URL.
- [ ] **Restricted pages**: switch to `chrome://settings` while guarding → safe behavior, no crash, no unsafe redirect.
- [ ] **Popup stop + worker restart**: stop from the popup; also let the service worker idle out (chrome://extensions → service worker "inactive"), trigger a tab switch → overlay still works or fails safely.

### History & data
- [ ] **Completion**: finish a guarded session → success summary recorded; growth/rewards granted once (re-run does not duplicate).
- [ ] **Incomplete**: revoke permission mid-session → incomplete record, not a score/failure grade.
- [ ] **Clear history**: Session Archive → **Clear session history** → records removed; companion name/colors/growth survive; reload confirms persistence.
- [ ] **Delete my data** still removes everything including companion settings (unchanged).

### Accessibility spot checks
- [ ] Keyboard-only: interruption overlay traps focus, Escape/Tab behave, one Back to course control reachable.
- [ ] Reduced motion (OS setting): Momo idle animation stops; all controls remain usable.

## Part D — Evidence

Attach to ticket #29: screenshots per scenario above, plus the automated-checks table. Release readiness may be claimed only after every box is ticked and evidence is attached.
