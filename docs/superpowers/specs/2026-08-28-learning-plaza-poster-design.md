# Learning Plaza project poster design

- **Status:** Approved direction; content brief recorded
- **Date:** 2026-08-28
- **Audience:** Academic evaluators, with enough product clarity for a project showcase
- **Reference:** `~/Downloads/500042_MANJU_Real_Poster.pdf`

## Goal

Create an academic-style project poster for Deep Work Course Guard / Learning Plaza. The poster should explain the problem, system workflow, privacy model, companion experience, and implementation validation without inventing research results or overstating what the product measures.

The application itself is already implemented. This poster task is a communication artifact and must not change application behavior, routes, APIs, extension integration, persistence, or privacy guarantees.

## Reference analysis

The supplied one-page PDF is an A1-proportioned portrait poster: 1683.75 × 2384.25 points, approximately 594 × 841 mm. Its visual structure is:

- high-impact branded header;
- author/company strip;
- dark title band;
- two-column body;
- rounded white content panels with strong colored outlines;
- a large methodology flow diagram on the right;
- objective, experiments, and business-impact panels on the left;
- conclusion/future-work panel and QR code near the bottom;
- sponsor/organization footer band.

The Learning Plaza poster should borrow this information hierarchy and scanability, not copy the reference poster's logos, imagery, wording, or exact visual assets.

## Recommended direction

Use an **academic project showcase** rather than a product advertisement or a dense engineering paper poster. The central visual should be a simple architecture and learner-flow diagram. Screenshots should provide product evidence, while short panels explain the design decisions.

### Alternatives considered

1. **Academic project showcase — recommended**
   - Best balance of motivation, method, privacy, UX, and validation.
   - Fits the reference's two-column academic structure.
   - Avoids unsupported performance claims because the project has implementation and test evidence rather than a controlled user study.
2. **Product/demo poster**
   - Would be more visual and shorter.
   - Risks under-explaining extension authority and privacy decisions for an academic audience.
3. **Technical architecture poster**
   - Would give more space to the secure bridge and state machine.
   - Risks making the learner problem and companion experience too difficult to understand at a glance.

## Poster information architecture

### Header

**Title:** Deep Work Course Guard: A Local-First Learning Companion for Gentle Focus

**Subtitle:** A privacy-first browser extension and companion dashboard that helps learners return to their online course without surveillance, punishment, or fixed Pomodoro intervals.

**Metadata placeholders:** `[Author name] | [Institution or company] | [Project/demo URL]`

### Objective

- Unwanted tab switching can interrupt online learning.
- Many blockers feel restrictive or punitive.
- Course Guard provides a gentle, learner-directed boundary.
- The system detects leaving the course website without reading page content.
- Session summaries and companion progress remain local to the browser.

### Methodology / system flow

Show this as the dominant right-column diagram:

`Select Course Website → Start Course Guard → Leave course origin → Return interruption → Back to course → Session complete`

Under the flow, show the system boundary:

`Learning Plaza web app ↔ secure allowlisted bridge ↔ Course Guard extension ↔ browser tab origin`

Call out that the extension is authoritative for active guard state. It checks the active tab's website origin, not page contents. On a distraction signal, the interruption offers a supportive message and a single Back to course action. Recovery uses the latest known in-course tab/URL and falls back to the setup URL when needed.

### Companion experience

Show the Focus Friend states as a small progression:

`Resting → Ready → Focusing → Encouraging → Proud`

Explain that mood, energy, growth, and cosmetic unlocks are expressive progress signals, not attention or performance scores. Reference the implemented Plaza, Course Guard, Archive, Wardrobe & Plaza, and Town Hall surfaces with screenshots or small cropped UI panels.

### Privacy by design

- No page-content reading.
- No uploaded browsing history.
- No camera frames transmitted.
- Explicit permission at guard start.
- Safe handling of permission denial or revocation.
- Local session history and companion progress.
- No leaderboard, streak pressure, punishment, or attention score.

### Validation / implementation evidence

Use verified engineering evidence, not fabricated user-study outcomes:

- 49 unit-test files and 219 unit tests passed.
- 25 responsive Playwright tests passed.
- Desktop and mobile route audit completed.
- Extension bridge and disconnected-state checks passed.
- Production build and extension build passed.

Label this section **Implementation validation** or **Engineering validation**, not **Experimental results**.

### Conclusion and future work

**Conclusion:** Deep Work Course Guard turns distraction recovery into a supportive interaction rather than a punishment. Learning Plaza combines a clear browser boundary with a friendly companion experience while keeping control, privacy, and progress local to the learner.

**Potential future work:** usability testing with online learners, accessibility testing with assistive technologies, cross-browser extension support, and evaluation of return-to-course behavior. These are proposed next steps, not completed results.

### Footer

Reserve a QR-code area for `[Demo or repository URL]`. Reserve a small footer for `[Author/institution details]`. Do not add sponsor or partner logos unless the user supplies approved assets and permission to use them.

## Visual system

Use the existing Learning Plaza identity as the source of truth; see `DESIGN.md` and `CONTEXT.md`.

- Portrait A1 canvas.
- Bright sky-blue header or background accent, warm cream panels, navy ink, grass green, sun yellow, coral, and plum accents.
- Strong dark title strips with white type.
- Two-column grid with the methodology diagram receiving the largest area.
- Rounded panels and thick outlined borders echoing the reference's modular structure.
- Newsreader for display headings and IBM Plex Sans for body and labels.
- Original Focus Friend and Learning Plaza screenshots only.
- Keep body copy short enough to scan from a standing distance; use diagrams and labels instead of paragraphs.

## Assets to prepare

- Plaza home screenshot.
- Course Guard station screenshot.
- Archive or empty-state screenshot.
- Town Hall/privacy screenshot.
- Extension popup or return-interruption screenshot.
- Original architecture/learner-flow diagram.
- Optional QR code after the destination URL is supplied.

Existing route-audit evidence is available at `/tmp/momo-route-audit/`. It may be used as a reference for choosing screenshots, but the final poster should use clean, intentional crops rather than a contact sheet.

## Missing inputs and safe placeholders

The following are intentionally placeholders until supplied:

- author name;
- institution/company or course name;
- demo/repository URL for the QR code;
- final output requirements (PDF only or editable source plus PDF);
- any required logos or event branding.

Do not infer these details from local paths, commit metadata, or unrelated files.

## Acceptance criteria

- The poster follows the approved A1 portrait, two-column showcase structure.
- A viewer can identify the learner problem, the Course Guard loop, the extension/web-app boundary, and the privacy model quickly.
- All claims are supported by `CONTEXT.md`, `DESIGN.md`, the implementation artifacts, or the stated verification evidence.
- The poster does not claim to measure attention, prove distraction, read page content, or provide user-study results.
- The poster uses original project visuals and does not reproduce the reference poster's proprietary logos or artwork.
- No application source files are changed as part of poster drafting.
