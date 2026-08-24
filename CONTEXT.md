# Deep Work Course Guard

Deep Work Course Guard is an online-learning browser extension that interrupts unwanted tab switching while a learner is taking an online course. It is not a Pomodoro timer and does not require fixed work or break intervals.

The core loop is:

`Course tab → Start guard → Leave the course → Interruption → Return to course`

The web app is now the full Learning Plaza dashboard: a colorful town hub where Course Guard, Session Archive, Wardrobe & Plaza, and Town Hall are represented as useful destinations. The browser extension remains the authoritative pocket companion for active guard state and interruption behavior.

The extension stores only its small guard state locally. It does not read page contents, upload browsing history, or claim to measure mental attention.

## Language

**Course Guard**:
A learner-directed mode that helps keep an online course in view.
_Avoid_: Monitoring mode, surveillance mode

**Course Website**:
The website where the learner opened the online course.
_Avoid_: Allowed site, safe site

**Distraction Signal**:
The learner has left the Course Website while the Course Guard is active.
_Avoid_: Distraction proof, attention failure

**Return Interruption**:
The clear, local prompt shown after a Distraction Signal, inviting the learner back to the course.
_Avoid_: Punishment, lockout, warning

**Successful Guard Session**:
A Course Guard run that the learner starts and later stops manually; Distraction Signals are recorded events, not failures.
_Avoid_: Pass, score, productivity result

**Learning Plaza**:
The web app's friendly town hub with Course Guard, Session Archive, Wardrobe & Plaza, and Town Hall destinations. It uses a light, local, non-competitive companion loop with mood, growth, rewards, and unlockable cosmetics.
_Avoid_: Leaderboard, public ranking, punitive game loop

**Focus Friend**:
A small original soft-mascot representation used to make Course Guard status feel welcoming; it does not judge, score, or claim to measure attention.
_Avoid_: Coach, monitor, pet that needs maintenance

**Companion Status**:
The primary Learning Plaza view showing the Focus Friend, current Course Guard state, simple local session signals such as course time and returns, and the single primary Start Course Guard action.
_Avoid_: Performance score, attention score, surveillance dashboard

**Focus Friend States**:
The companion states shown by the mascot: Resting, Ready, Focusing, Encouraging, and Proud. Mood and energy are expressive progress signals, not health or performance scores.
_Avoid_: Hunger, illness, death, failure state, attention score

**Session History Summary**:
The local record for one Successful Guard Session: Course Website, start and stop time, active time, interruption count, return count, and successful status. Records remain local until the learner explicitly clears them.
_Avoid_: Productivity score, ranking, attention grade

**Behavioral Companion Response**:
A small visual and textual Focus Friend response to Course Guard lifecycle events: starting, leaving the Course Website, returning, and manually completing a session. Responses are visual by default, with optional sound disabled initially. It does not infer attention or judge the learner.
_Avoid_: Emotional diagnosis, behavior scoring, punishment

**Cross-Surface Companion**:
The web app shows the full Focus Friend dashboard experience; the Chrome extension shows only a compact reaction within the Course Guard interruption and status surfaces. The interruption uses one short supportive message and the single Back to course action.
_Avoid_: Recreating the full game dashboard inside every browser surface

**Extension Connection State**:
The web app must distinguish Connected, Disconnected, and Guard active before enabling the primary Course Guard action; it never presents a locally clicked start as active until the extension confirms it.
_Avoid_: Ambiguous sync, fake active state

**Live Guard Status**:
While Course Guard is active, the extension remains authoritative and sends state changes through the secure web-app bridge; the web app updates the Focus Friend and local session summary, and shows a connection warning if updates stop.
_Avoid_: Web app independently claiming guard state

**Secure Course Guard Bridge**:
The web app connects to the extension only from the production GitHub Pages origin or approved local-development origins through an allowlisted, versioned external messaging protocol. The extension validates sender origin, message type, and payload before acting; the bridge carries guard state and approved local event fields only.
_Avoid_: Open webpage access, arbitrary commands, page-content transport

**Extension-Controlled Consent**:
Course-origin host access is requested and confirmed by the extension at guard start, then removed when guard stops. The web app remains in Connect or Permission needed until the extension confirms access.
_Avoid_: False active state, silent permission escalation

**Origin-Based Guard**:
Course Guard allows all tabs on the selected Course Website origin; switching the active tab to another origin produces a Distraction Signal and Return Interruption.
_Avoid_: Blocking individual course pages or reading page content

**Return Destination**:
Back to course returns the learner to the most recent known in-course tab and URL; if that tab or URL is unavailable, it falls back to the Course URL entered during setup.
_Avoid_: Unexpected external redirect, generic blank tab

**Immediate Stop**:
Stop Course Guard ends the active session immediately from either the web app or extension popup, changes the Focus Friend to Session complete, and saves the local Session History Summary without a confirmation dialog.
_Avoid_: Trapping the learner in guard mode, accidental unsaved sessions

**Permission Denial**:
If optional host access is declined, Course Guard remains off and explains that access is needed to detect leaving the Course Website; it does not read page content.
_Avoid_: Starting an unprotected session, coercive permission prompt

**Permission Revocation**:
If host access disappears during an active session, Course Guard stops safely, reports that protection ended, and saves the session as incomplete rather than claiming the guard continued.
_Avoid_: Silent failure, false successful session

**Town Hall**:
The Town Hall destination contains Focus Friend personalization, privacy and local-data controls, reduced motion, and extension connection/recovery help.
_Avoid_: Habit pressure, notification centers, social comparison

**Focus Friend Personalization**:
The learner may set a companion name and equip locally unlocked cosmetics such as stickers, hats, and plaza decorations. Unlocks come from positive focused learning and never require currency or maintenance.
_Avoid_: Collection pressure, monetized customization, hunger, maintenance loop

The terms below describe the existing PWA learning-history surface. They are not the primary language for the Course Guard extension.

**Focus Session**:
A student-directed period with a stated subject, goal, and duration.
_Avoid_: Monitoring session, surveillance session

**Camera-Aware Session**:
A Focus Session in which the student has explicitly allowed local camera analysis.
_Avoid_: Tracked session, watched session

**Timer-Only Session**:
A Focus Session that runs without camera analysis.
_Avoid_: Disabled session, limited session

**Observation**:
A temporary local description of visible face presence, downward gaze, or head-away posture at one moment.
_Avoid_: Attention measurement, distraction proof

**Reliable Evidence**:
An Observation with enough visible information to contribute to an awareness decision.
_Avoid_: Accurate attention, confirmed distraction

**Awareness Event**:
A supportive session event produced after Reliable Evidence persists beyond the selected threshold.
_Avoid_: Violation, failure, distraction proof

**Gentle Reset**:
The non-blocking prompt shown after an Awareness Event, offering a return to study, a Quick Review, or a Notes Pause.
_Avoid_: Warning, punishment, lockout

**Sensitivity Preset**:
The Gentle, Balanced, or Strict timing policy used to decide when persistent observations produce an Awareness Event.
_Avoid_: Attention level, discipline level

**Notes Pause**:
A student-selected period in which camera awareness pauses because the student is reading or writing away from the screen.
_Avoid_: Exception, excuse

**Quick Review**:
One optional question from a student-selected local Question Deck.
_Avoid_: Test, mandatory quiz

**Question Deck**:
A local, editable collection of study questions and explanations for one subject.
_Avoid_: Online course, generated assessment

**Learning Garden**:
A permanent, non-competitive record of completed Focus Sessions represented through botanical growth.
_Avoid_: Streak, leaderboard, productivity score
