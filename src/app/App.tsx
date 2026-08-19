import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  openDeepWorkRepository,
  type DeepWorkRepository,
  type RepositorySnapshot,
  type SessionPreferences,
  type SessionSummary,
} from "../storage/repository";

const MINUTE = 60_000;
const initialConfig: SessionConfig = {
  durationMs: 25 * MINUTE,
  goal: "",
  sound: "silent",
  subject: "",
};

const initialSnapshot: RepositorySnapshot = {
  active: null,
  garden: { plants: [], schemaVersion: 1 },
  preferences: { durationMs: 25 * MINUTE, sound: "silent" },
  schemaVersion: 1,
  summaries: [],
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

function reflectionLabel(value: Reflection): string {
  return value === "not-yet" ? "Not yet" : capitalize(value);
}

function sessionFromSummary(summary: SessionSummary): SessionState {
  return {
    config: {
      durationMs: summary.durationMs,
      goal: summary.goal,
      sound: "silent",
      subject: summary.subject,
    },
    elapsedMs: summary.elapsedMs,
    finishReason: summary.finishReason,
    finishedAtMs: summary.finishedAtMs,
    pausedAtMs: null,
    phase: "complete",
    reflection: summary.reflection ?? null,
    sessionId: summary.sessionId,
    sessionStartedAtMs: summary.startedAtMs,
    startedAtMs: null,
  };
}

function sessionPreferences(snapshot: RepositorySnapshot): SessionPreferences {
  return {
    durationMs: snapshot.preferences.durationMs,
    sound: snapshot.preferences.sound,
  };
}

function newSessionId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;
}

function gardenStageLabel(stage: "sprout" | "leaf" | "bloom"): string {
  return stage === "bloom" ? "Bloom" : stage === "leaf" ? "Leaf" : "Sprout";
}

function summaryStatus(finishReason: "completed" | "ended"): string {
  return finishReason === "completed" ? "Completed" : "Ended early";
}

function formatHistoryDuration(elapsedMs: number): string {
  const minutes = Math.max(1, Math.round(elapsedMs / MINUTE));
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

type ProgressShelfProps = {
  onDelete: () => void;
  onExport: () => void;
  snapshot: RepositorySnapshot;
};

function ProgressShelf({ onDelete, onExport, snapshot }: ProgressShelfProps) {
  return (
    <section className="progress-shelf" aria-labelledby="garden-title">
      <div className="progress-header">
        <div>
          <p className="section-kicker">Private progress</p>
          <h2 id="garden-title">Learning Garden</h2>
        </div>
        <p className="garden-count">
          {snapshot.garden.plants.length} {snapshot.garden.plants.length === 1 ? "plant" : "plants"}
        </p>
      </div>

      {snapshot.garden.plants.length > 0 ? (
        <ul className="garden-list">
          {snapshot.garden.plants.map((plant) => (
            <li key={plant.sessionId}>
              <span className={`garden-stage garden-stage-${plant.stage}`}>
                {gardenStageLabel(plant.stage)}
              </span>
              <span>{plant.subject}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-progress">No completed sessions yet.</p>
      )}

      <div className="history-heading">
        <h3>Session history</h3>
        <p>Only your subjects, goals, timing, reflections, and session status are kept here.</p>
      </div>
      {snapshot.summaries.length > 0 ? (
        <ol className="history-list">
          {[...snapshot.summaries].reverse().map((summary) => (
            <li key={summary.sessionId}>
              <div className="history-main">
                <strong>{summary.subject}</strong>
                <span>{summary.goal}</span>
              </div>
              <div className="history-meta">
                <span>{summaryStatus(summary.finishReason)}</span>
                <span>{formatHistoryDuration(summary.elapsedMs)}</span>
                {summary.reflection && (
                  <span>Reflection: {reflectionLabel(summary.reflection)}</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-progress">Complete a session to add its summary here.</p>
      )}

      <div className="data-actions">
        <button className="secondary-button" type="button" onClick={onExport}>
          Export my data
        </button>
        <button className="text-button" type="button" onClick={onDelete}>
          Delete my data
        </button>
      </div>
    </section>
  );
}

type DeleteDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteDialog({ onCancel, onConfirm }: DeleteDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
      >
        <p className="section-kicker">Local data control</p>
        <h2 id="delete-title">Delete all local data?</h2>
        <p>
          This removes your sessions, reflections, Learning Garden, and saved preferences from this
          device.
        </p>
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Keep my data
          </button>
          <button className="danger-button" type="button" onClick={onConfirm}>
            Delete all local data
          </button>
        </div>
      </section>
    </div>
  );
}

function dispatchEvent(
  setSession: React.Dispatch<React.SetStateAction<SessionState>>,
  event: SessionEvent,
) {
  setSession((current) => reduceSession(current, event));
}

type AppProps = {
  repository?: DeepWorkRepository;
};

export function App({ repository: providedRepository }: AppProps = {}) {
  const [form, setForm] = useState(initialConfig);
  const [session, setSession] = useState(() => createSessionState(initialConfig));
  const [snapshot, setSnapshot] = useState<RepositorySnapshot>(initialSnapshot);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [storageStatus, setStorageStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const repositoryRef = useRef<DeepWorkRepository | null>(providedRepository ?? null);
  const hydratedRef = useRef(false);
  const persistedPhaseRef = useRef<SessionState["phase"] | null>(null);
  const persistenceQueueRef = useRef(Promise.resolve());

  const queuePersistence = useCallback(
    (operation: (repository: DeepWorkRepository) => Promise<unknown>) => {
      persistenceQueueRef.current = persistenceQueueRef.current
        .then(async () => {
          const repository = repositoryRef.current;
          if (!repository) return;
          try {
            await operation(repository);
          } catch {
            setStorageStatus("unavailable");
          }
        })
        .catch(() => undefined);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    let ownsRepository = false;

    async function hydrate() {
      let repository = providedRepository;
      try {
        if (!repository) {
          repository = await openDeepWorkRepository();
          ownsRepository = true;
        }

        const snapshot = await repository.load();
        if (cancelled) return;

        repositoryRef.current = repository;
        setSnapshot(snapshot);
        const recoveredSession =
          snapshot.active ??
          (snapshot.summaries.length > 0
            ? sessionFromSummary(snapshot.summaries[snapshot.summaries.length - 1]!)
            : null);
        if (recoveredSession) {
          setSession(recoveredSession);
          setNowMs(Date.now());
        }
        const preferences = sessionPreferences(snapshot);
        setForm((current) => ({ ...current, ...preferences }));
        setStorageStatus("ready");
      } catch {
        if (!cancelled) setStorageStatus("unavailable");
      } finally {
        if (!cancelled) hydratedRef.current = true;
        if (cancelled && ownsRepository) repository?.close();
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
      if (ownsRepository) repositoryRef.current?.close();
    };
  }, [providedRepository]);

  useEffect(() => {
    if (!hydratedRef.current || storageStatus === "unavailable") return;
    queuePersistence((repository) =>
      repository.savePreferences({ durationMs: form.durationMs, sound: form.sound }),
    );
  }, [form.durationMs, form.sound, queuePersistence, storageStatus]);

  useEffect(() => {
    if (!hydratedRef.current || storageStatus === "unavailable") return;
    if (session.phase === "focus" && persistedPhaseRef.current === "focus") return;
    persistedPhaseRef.current = session.phase;

    if (session.phase === "focus" || session.phase === "paused" || session.phase === "reflection") {
      queuePersistence((repository) => repository.saveActiveSession(session));
    } else if (session.phase === "complete") {
      queuePersistence(async (repository) => {
        setSnapshot(await repository.completeSession(session));
      });
    }
  }, [queuePersistence, session, storageStatus]);

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
    setSession(
      reduceSession(createSessionState(config), {
        atMs: Date.now(),
        sessionId: newSessionId(),
        type: "START",
      }),
    );
  }

  function chooseReflection(value: Reflection) {
    dispatchEvent(setSession, { atMs: nowMs, type: "REFLECT", value });
  }

  function exportData() {
    queuePersistence(async (repository) => {
      const content = await repository.exportData();
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "deep-work-companion-data.json";
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  function deleteAllData() {
    setDeleteDialogOpen(false);
    persistedPhaseRef.current = "setup";
    setForm({ ...initialConfig });
    setSession(createSessionState(initialConfig));
    setSnapshot(initialSnapshot);
    queuePersistence(async (repository) => {
      setSnapshot(await repository.deleteAllData());
    });
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
            {storageStatus === "loading" && (
              <p className="storage-status" role="status">
                Restoring your local session...
              </p>
            )}
            {storageStatus === "unavailable" && (
              <p className="storage-status" role="status">
                Local saving is unavailable. This session will still run in memory.
              </p>
            )}
            <p className="form-footnote">You can pause or end the session whenever you need.</p>
          </form>
        </section>
        <ProgressShelf
          onDelete={() => setDeleteDialogOpen(true)}
          onExport={exportData}
          snapshot={snapshot}
        />
        {deleteDialogOpen && (
          <DeleteDialog onCancel={() => setDeleteDialogOpen(false)} onConfirm={deleteAllData} />
        )}
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
                {reflectionLabel(value)}
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
        <p className="complete-subject">{session.config.subject}</p>
        <p className="complete-goal">{session.config.goal}</p>
        {session.reflection && (
          <p className="complete-reflection">Reflection: {reflectionLabel(session.reflection)}</p>
        )}
        <p>
          {storageStatus === "ready"
            ? "Your goal reflection is saved on this device for your private review."
            : "Your goal reflection is available for this session only."}
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={() => dispatchEvent(setSession, { type: "RESET" })}
        >
          Start another session
        </button>
      </section>
      <ProgressShelf
        onDelete={() => setDeleteDialogOpen(true)}
        onExport={exportData}
        snapshot={snapshot}
      />
      {deleteDialogOpen && (
        <DeleteDialog onCancel={() => setDeleteDialogOpen(false)} onConfirm={deleteAllData} />
      )}
    </main>
  );
}
