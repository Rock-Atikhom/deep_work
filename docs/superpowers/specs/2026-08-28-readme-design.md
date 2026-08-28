# Deep Work Course Guard README design

- **Status:** Approved direction; documentation design pending review
- **Audience:** GitHub visitors, learners evaluating the project, developers running or contributing to it
- **Primary artifact:** Root `README.md`

## Goal

Create a concise, trustworthy project README that explains what Deep Work Course Guard / Learning Plaza does, how its web app and Chrome extension fit together, how privacy works, how to run the project locally, how to load the extension, how to verify the system, and where to find the project poster draft.

## Recommended structure

1. **Project title and one-sentence value proposition**
2. **What it does** — the Course Guard loop and the distinction from a Pomodoro timer
3. **Product surfaces** — Learning Plaza, Course Guard, Archive, Wardrobe & Plaza, Town Hall, extension popup, and interruption surface
4. **How it works** — origin-based detection, supportive return interruption, extension authority, secure bridge, and local persistence
5. **Privacy and safety** — no page-content reading, no uploaded history, no camera-frame transport, explicit permission, local state, and non-punitive language
6. **Technology and repository map** — React/Vite web app, Manifest V3 extension, local storage/vision surfaces, and links to `CONTEXT.md`, `DESIGN.md`, and `docs/browser-extension.md`
7. **Local web-app setup** — Node/npm requirements, install, dev server, production build, and preview
8. **Chrome extension setup** — build, load unpacked `dist-extension/`, connect the local app, and explain the extension ID configuration without exposing real IDs
9. **Verification commands** — unit tests, formatting, lint, typecheck, manifest check, app build, extension build, poster renderer, and browser acceptance tests
10. **Poster draft** — link to the tracked poster source and explain that rendered PDF/PNG exports are generated under `/tmp/learning-plaza-poster/`
11. **Project principles and contribution guidance** — preserve local-first privacy, extension authority, supportive copy, accessibility, and original visuals; avoid unsupported claims
12. **License and third-party notices** — link to existing `LICENSE` and `THIRD_PARTY_NOTICES.md`

## Content rules

- Use verified facts from `CONTEXT.md`, `DESIGN.md`, and `docs/browser-extension.md`; reference those documents instead of duplicating their full terminology dictionaries.
- Keep Course Guard language learner-directed and supportive. Do not describe it as monitoring, surveillance, punishment, a productivity score, or proof of distraction.
- Clearly distinguish the browser extension's authoritative active guard state from the web app's companion dashboard.
- State that camera-aware learning-history features are local and separate from the primary Course Guard extension language.
- Use safe shell placeholders such as `<your-extension-id>` only where the existing setup requires user-supplied local configuration.
- Do not include secrets, personal identifiers, private filesystem paths, or unverified performance claims.
- Link to the merged poster source in `public/poster/` and the reproducible `npm run poster:render` command; do not commit generated temporary exports into the README.

## README tone and format

- Use short sections, direct headings, numbered setup steps, and copy-pasteable shell commands.
- Put the learner-facing explanation before developer setup.
- Use one compact architecture diagram in text rather than embedding a large duplicated diagram.
- Keep the README useful without requiring the reader to open every design artifact; use links for deeper decisions.
- Mention that the project is a working local-first companion and extension, not a hosted SaaS product.

## Acceptance criteria

- A new reader can understand the problem and core loop in under one minute.
- A developer can install dependencies, run the web app, build/load the extension, and run verification from the README alone.
- Privacy, permission, extension authority, and unsupported-claim guardrails are explicit.
- All commands match `package.json` and current repository paths.
- Poster source and rendering workflow are discoverable.
- The README does not modify application code or contradict the existing project docs.
