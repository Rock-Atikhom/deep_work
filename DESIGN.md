---
version: "alpha"
name: Learning Plaza
description: A cheerful, local-first study town with a light Tamagotchi-inspired companion loop.
colors:
  plaza-sky: "#A9D8E8"
  plaza-grass: "#68A86E"
  plaza-grass-dark: "#2E6941"
  plaza-sun: "#FFD66B"
  plaza-coral: "#EF8E72"
  plaza-water: "#8BC6DF"
  plaza-plum: "#755B82"
  plaza-panel: "#FFF7E9"
  plaza-ink: "#243347"
  plaza-muted: "#56657A"
typography:
  display:
    fontFamily: Newsreader
    fontWeight: 500
  body:
    fontFamily: "IBM Plex Sans"
    fontWeight: 400
  label:
    fontFamily: "IBM Plex Sans"
    fontWeight: 800
rounded:
  card: "20px"
  button: "13px"
  pill: "999px"
principles:
  - "The web app is a colorful town hub; the extension is a small pocket companion."
  - "Focus Friend responds to learning events with mood, growth, rewards, and cosmetics."
  - "Progress is positive and non-punitive: no hunger, illness, death, streak pressure, or leaderboards."
  - "Course Guard remains authoritative in the extension and uses supportive return copy."
  - "All companion and session data stays local to the browser."
---

## Product character

Learning Plaza is a study dashboard with the emotional grammar of a cozy town game. It is inspired by the town, shop, visitor, and activity structure of Tamagotchi Plaza while using original characters, CSS illustrations, labels, and layouts.

The plaza should feel bright, hand-built, and welcoming. The learner should know what to do within a few seconds: meet Focus Friend, choose a course, and start a protected session.

## Surfaces

- **Plaza home:** central Focus Friend scene, mood/energy/level, next unlock, recent learning, and four destinations.
- **Course Guard station:** course door, extension state, return count, study intention, and one primary start/stop action.
- **Session Archive:** completed and incomplete Course Guard summaries, time, returns, growth, and rewards.
- **Wardrobe & Plaza:** companion cosmetics and future town decorations.
- **Town Hall:** extension connection, privacy, local data, reduced motion, and recovery.
- **Extension popup:** a compact companion check-in with one primary action and Open Learning Plaza.
- **Interruption overlay:** Focus Friend, course label, supportive message, return count, and Back to course.

## Light game loop

Starting a guard session makes Focus Friend focus. A detected cross-origin tab makes the companion encouraging. Returning to the course restores the focusing state. Completing or ending a session grants positive growth based on focused minutes; completed sessions can unlock cosmetics such as stickers, hats, and plaza decorations.

The loop never removes health or progress for breaks, missed days, or returns. Course Guard is a gentle boundary, not a punishment screen.

## Visual language

Use flat, high-contrast color blocks: sky blue for the town backdrop, grass green for safe actions, sun yellow for rewards, coral for companion energy, and warm cream for readable panels. Use thick ink outlines, rounded cards, signboards, simple geometric buildings, and small purposeful motion.

The companion is an original CSS/inline illustration. State changes are expressed through expression, posture, a small mood dot, and copy. Motion stops when reduced motion is enabled.

## Accessibility and privacy

Never communicate a state by color alone. Every meter has a visible label and accessible value. Every destination is a keyboard-reachable link. Focus rings remain visible. Companion artwork has an accessible role and label. The interruption is a labelled dialog with focus on **Back to course**.

The web app stores only approved local summaries and companion progress. The extension stores only the active guard state and the latest in-course location needed for safe recovery. No page content, screenshots, camera frames, detailed browsing history, or attention inference crosses the bridge.

## Do and do not

- Do use playful town language: plaza, station, archive, wardrobe, town hall, visitors, growth, and rewards.
- Do keep one obvious primary action per surface.
- Do use sentence case and supportive messages.
- Do preserve the legacy timer, camera, vision, question deck, legal, export, and deletion paths.
- Do keep extension authority explicit in status copy.
- Do not copy Tamagotchi proprietary artwork, names, characters, or exact layouts.
- Do not add leaderboards, social comparison, streak guilt, hunger, illness, death, or failure states.
- Do not claim tab switching proves distraction or measures attention.
