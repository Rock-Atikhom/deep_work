import { useEffect, useState } from "react";
import {
  createSessionState,
  reduceSession,
  remainingMs,
  type Reflection,
  type SessionConfig,
  type SessionEvent,
  type SessionState,
  type SoundPreference,
} from "../session/session-machine";

const MINUTE = 60_000;
const initialConfig: SessionConfig = {
  durationMs: 25 * MINUTE,
  goal: "",
  sound: "silent",
  subject: "",
};

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(durationMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function dispatchEvent(
  setSession: React.Dispatch<React.SetStateAction<SessionState>>,
  event: SessionEvent,
) {
  setSession((current) => reduceSession(current, event));
}

export function App() {
  const [form, setForm] = useState(initialConfig);
  const [session, setSession] = useState(() => createSessionState(initialConfig));
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (session.phase !== "focus") return undefined;

    const interval = window.setInterval(() => {
      setNowMs(Date.now());
      dispatchEvent(setSession, { type: "TICK", atMs: Date.now() });
    }, 250);

    return () => window.clearInterval(interval);
  }, [session.phase]);

  const canStart = form.subject.trim().length > 0 && form.goal.trim().length > 0;
  const timeRemaining = remainingMs(session, nowMs);

  function startSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canStart) return;

    const config: SessionConfig = {
      durationMs: form.durationMs,
      goal: form.goal.trim(),
      sound: form.sound,
      subject: form.subject.trim(),
    };

    setNowMs(Date.now());
    setSession(reduceSession(createSessionState(config), { type: "START", atMs: Date.now() }));
  }

  function chooseReflection(value: Reflection) {
    dispatchEvent(setSession, { type: "REFLECT", value });
  }

  if (session.phase === "setup") {
    return (
      <main className="page-shell">
        <section className="setup-layout" aria-labelledby="setup-title">
          <div className="intro-column">
            <p className="product-mark">Deep Work Companion</p>
            <h1 id="setup-title">Make room for focused learning</h1>
            <p className="intro-copy">
              Choose one subject and one goal. The timer keeps the next study block clear.
            </p>
            <div className="mode-note" role="note">
              <span className="mode-note-label">Today&apos;s mode</span>
              <strong>Timer-Only Session</strong>
              <span>No camera analysis is used in this session.</span>
            </div>
          </div>

          <form className="intention-form" onSubmit={startSession}>
            <div className="form-heading">
              <h2>Set your intention</h2>
              <p>A small, specific goal gives the session somewhere to return to.</p>
            </div>

            <label className="field">
              <span>Subject</span>
              <input
                value={form.subject}
                onChange={(event) =>
                  setForm((current) => ({ ...current, subject: event.target.value }))
                }
                placeholder="For example, SQL"
                autoComplete="off"
              />
            </label>

            <label className="field">
              <span>Session goal</span>
              <textarea
                value={form.goal}
                onChange={(event) =>
                  setForm((current) => ({ ...current, goal: event.target.value }))
                }
                placeholder="What would you like to understand or finish?"
                rows={3}
              />
            </label>

            <fieldset className="choice-group">
              <legend>Time available</legend>
              <div className="choice-row">
                {[25, 50].map((minutes) => (
                  <label className="choice" key={minutes}>
                    <input
                      type="radio"
                      name="duration"
                      checked={form.durationMs === minutes * MINUTE}
                      onChange={() =>
                        setForm((current) => ({ ...current, durationMs: minutes * MINUTE }))
                      }
                    />
                    <span>{minutes} minutes</span>
                  </label>
                ))}
              </div>
              <label className="field custom-duration">
                <span>Custom minutes</span>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={
                    form.durationMs !== 25 * MINUTE && form.durationMs !== 50 * MINUTE
                      ? form.durationMs / MINUTE
                      : ""
                  }
                  onChange={(event) => {
                    const minutes = Number(event.target.value);
                    setForm((current) => ({
                      ...current,
                      durationMs:
                        Number.isFinite(minutes) && minutes > 0
                          ? minutes * MINUTE
                          : current.durationMs,
                    }));
                  }}
                  placeholder="Minutes"
                  inputMode="numeric"
                />
              </label>
            </fieldset>

            <fieldset className="choice-group">
              <legend>Sound</legend>
              <div className="choice-row">
                {(["silent", "soft", "standard"] as const).map((sound: SoundPreference) => (
                  <label className="choice" key={sound}>
                    <input
                      type="radio"
                      name="sound"
                      checked={form.sound === sound}
                      onChange={() => setForm((current) => ({ ...current, sound }))}
                    />
                    <span>{sound === "silent" ? "Off" : capitalize(sound)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button className="primary-button" type="submit" disabled={!canStart}>
              Start session
            </button>
            <p className="form-footnote">You can pause or end the session whenever you need.</p>
          </form>
        </section>
      </main>
    );
  }

  if (session.phase === "focus" || session.phase === "paused") {
    const isPaused = session.phase === "paused";
    return (
      <main className="page-shell">
        <section className="focus-stage" aria-labelledby="focus-title">
          <header className="focus-header">
            <div>
              <p className="product-mark">Deep Work Companion</p>
              <p className="focus-subject">{session.config.subject}</p>
            </div>
            <span className="status-label">Timer-Only Session</span>
          </header>

          <div className="focus-main">
            <p className="focus-kicker">One thing for now</p>
            <h1 id="focus-title">Focus Stage</h1>
            <p className="focus-goal">{session.config.goal}</p>
            <time
              className="timer"
              dateTime={`PT${Math.ceil(timeRemaining / 1_000)}S`}
              aria-label={`${formatDuration(timeRemaining)} remaining`}
            >
              {formatDuration(timeRemaining)}
            </time>
            <p className="timer-caption">{isPaused ? "Session paused" : "Time remaining"}</p>
          </div>

          <div className="focus-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                dispatchEvent(setSession, { type: isPaused ? "RESUME" : "PAUSE", atMs: Date.now() })
              }
            >
              {isPaused ? "Resume session" : "Pause session"}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => dispatchEvent(setSession, { type: "END", atMs: Date.now() })}
            >
              End session
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (session.phase === "reflection") {
    return (
      <main className="page-shell">
        <section className="reflection-card" aria-labelledby="reflection-title">
          <p className="product-mark">Deep Work Companion</p>
          <h1 id="reflection-title">Reflect on this session</h1>
          <p className="reflection-subject">{session.config.subject}</p>
          <p className="reflection-goal">{session.config.goal}</p>
          <p className="reflection-prompt">Did you complete your goal?</p>
          <div className="reflection-actions">
            {(["yes", "partly", "not-yet"] as const).map((value) => (
              <button
                className="reflection-button"
                key={value}
                type="button"
                onClick={() => chooseReflection(value)}
              >
                {value === "not-yet" ? "Not yet" : capitalize(value)}
              </button>
            ))}
          </div>
          <p className="reflection-note">Your answer is for your own review. It is not a score.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="complete-card" aria-labelledby="complete-title">
        <p className="product-mark">Deep Work Companion</p>
        <h1 id="complete-title">Session complete</h1>
        <p>Your goal reflection is saved for this screen only in this first session slice.</p>
        <button
          className="primary-button"
          type="button"
          onClick={() => dispatchEvent(setSession, { type: "RESET" })}
        >
          Start another session
        </button>
      </section>
    </main>
  );
}
