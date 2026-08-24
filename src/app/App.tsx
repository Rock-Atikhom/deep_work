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
  cloneQuestionDeck,
  serializeQuestionDeck,
  type QuestionDeck,
} from "../decks/question-deck";
import type { PresetName } from "../session/session-types";
import { useSessionController, type CameraAdapter } from "./use-session-controller";
import type { VisionClient } from "../vision/vision-client";
import { CalibrationScreen } from "../ui/screens/CalibrationScreen";
import { QuickReviewScreen } from "../ui/screens/QuickReviewScreen";
import { HistoryScreen } from "../ui/screens/HistoryScreen";
import { ReflectionScreen } from "../ui/screens/ReflectionScreen";
import { SettingsScreen } from "../ui/screens/SettingsScreen";
import { DeckLibraryScreen } from "../ui/screens/DeckLibraryScreen";
import { StaticSkeleton } from "../ui/components/StaticSkeleton";
import { BotanicalProgress } from "../ui/components/BotanicalProgress";
import { GentleResetDialog } from "../ui/components/GentleResetDialog";
import { LegalFooter, LegalScreen } from "../ui/screens/LegalScreen";
import { parseHashRoute } from "./hash-route";
import { playAwarenessChime } from "../alerts/sound";
import {
  openDeepWorkRepository,
  type DeepWorkRepository,
  type RepositorySnapshot,
  type SessionSummary,
} from "../storage/repository";
import {
  createChromeCourseGuardBridge,
  type CourseGuardBridge,
  type CourseGuardBridgeEvent,
} from "../course-guard/bridge";
import {
  courseGuardOriginFromUrl,
  isCourseGuardCourseUrl,
  type CourseGuardSnapshot,
} from "../course-guard/bridge-contract";
import {
  companionMoodForGuardState,
  createInitialPlazaState,
  reducePlazaState,
} from "../plaza/plaza-machine";
import type { PlazaEvent } from "../plaza/plaza-machine";
import type { CourseGuardSessionRecord } from "../plaza/plaza-types";
import { plazaOutcomeFromCoreSession } from "../plaza/core-session-outcome";
import { nextUnlock, rewardForSession } from "../plaza/plaza-rewards";
import { CourseGuardScreen } from "../ui/screens/CourseGuardScreen";
import { PlazaHomeScreen } from "../ui/screens/PlazaHomeScreen";
import { SessionArchiveScreen } from "../ui/screens/SessionArchiveScreen";
import { SessionRewardScreen } from "../ui/screens/SessionRewardScreen";
import { TownHallScreen } from "../ui/screens/TownHallScreen";
import { WardrobeScreen } from "../ui/screens/WardrobeScreen";

const MINUTE = 60_000;
const initialConfig: SessionConfig = {
  durationMs: 25 * MINUTE,
  goal: "",
  preset: "balanced",
  sound: "silent",
  subject: "",
};

const initialSnapshot: RepositorySnapshot = {
  active: null,
  decks: [],
  garden: { plants: [], schemaVersion: 1 },
  plaza: createInitialPlazaState(),
  preferences: { durationMs: 25 * MINUTE, selectedDeckId: null, sound: "silent" },
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

function gardenStageLabel(stage: "sprout" | "leaf" | "bloom"): string {
  return stage === "bloom" ? "Bloom" : stage === "leaf" ? "Leaf" : "Sprout";
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
    awarenessCount: summary.awarenessCount,
    awarenessMode: "active",
    quickReviewCompleted: summary.quickReviewCompleted === true,
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

function sessionPreferences(snapshot: RepositorySnapshot) {
  return {
    durationMs: snapshot.preferences.durationMs,
    preset: snapshot.preferences.preset ?? "balanced",
    sound: snapshot.preferences.sound,
  };
}

function newSessionId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;
}

function newQuestionDeck(): QuestionDeck {
  const id = `deck-${newSessionId()}`;
  return {
    id,
    name: "",
    questions: [{ explanation: "", id: `${id}-question-1`, prompt: "" }],
    schemaVersion: 1,
    subject: "",
  };
}

const defaultCourseGuardBridge = createChromeCourseGuardBridge();

function CourseGuardConnectionStatus({
  connection,
  permissionNeeded,
  state,
}: {
  connection: "connected" | "disconnected";
  permissionNeeded: boolean;
  state: CourseGuardSnapshot | null;
}) {
  const label =
    connection === "disconnected"
      ? "Extension disconnected"
      : permissionNeeded
        ? "Permission needed"
        : state?.phase === "watching"
          ? "Guarding course"
          : state?.phase === "interruption"
            ? "Return to course"
            : "Extension connected";
  const detail =
    connection === "disconnected"
      ? "Install or open the Chrome extension to connect Course Guard."
      : permissionNeeded
        ? "Allow access from the extension popup so Course Guard can detect when you leave the course website."
        : state?.phase === "watching"
          ? "The extension is the source of truth for this active guard."
          : state?.phase === "interruption"
            ? "The extension is waiting for you to return to your course."
            : "The extension is reachable. Start state will be confirmed by Chrome.";

  return (
    <section
      className={`course-guard-connection course-guard-connection-${connection}`}
      aria-label="Course Guard connection status"
      aria-live="polite"
    >
      <div className="course-guard-connection-heading">
        <span className="mode-note-label">Course Guard</span>
        <strong>{label}</strong>
      </div>
      <p>{detail}</p>
    </section>
  );
}

type DeckWorkspaceProps = {
  draft: QuestionDeck | null;
  message: { kind: "error" | "success"; text: string } | null;
  onAddQuestion: () => void;
  onDelete: () => void;
  onDraftChange: (draft: QuestionDeck) => void;
  onExport: (deck: QuestionDeck) => void;
  onImport: (file: File) => void;
  onNew: () => void;
  onSave: () => void;
  onSelect: (deckId: string | null) => void;
  selectedDeckId: string | null;
  decks: QuestionDeck[];
};

function DeckWorkspace({
  draft,
  message,
  onAddQuestion,
  onDelete,
  onDraftChange,
  onExport,
  onImport,
  onNew,
  onSave,
  onSelect,
  selectedDeckId,
  decks,
}: DeckWorkspaceProps) {
  function updateDraft(changes: Partial<QuestionDeck>) {
    if (draft) onDraftChange({ ...draft, ...changes });
  }

  return (
    <DeckLibraryScreen>
      <label className="field" htmlFor="question-deck-select">
        <span>Question Deck</span>
        <select
          id="question-deck-select"
          value={selectedDeckId ?? ""}
          onChange={(event) => onSelect(event.target.value || null)}
        >
          <option value="">Continue without a deck</option>
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name} · {deck.subject}
            </option>
          ))}
        </select>
      </label>

      <div className="deck-actions">
        <button className="secondary-button" type="button" onClick={onNew}>
          New deck
        </button>
        <label className="file-button secondary-button">
          Import Question Deck
          <input
            aria-label="Import Question Deck"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      {message && (
        <p
          className={`deck-message deck-message-${message.kind}`}
          role={message.kind === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}

      {draft ? (
        <form
          className="deck-editor"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div className="deck-editor-heading">
            <h3>{decks.some((deck) => deck.id === draft.id) ? "Edit deck" : "New deck"}</h3>
            <span>{draft.questions.length} questions</span>
          </div>
          <label className="field">
            <span>Deck name</span>
            <input
              value={draft.name}
              onChange={(event) => updateDraft({ name: event.target.value })}
              placeholder="For example, Cell biology review"
            />
          </label>
          <label className="field">
            <span>Deck subject</span>
            <input
              value={draft.subject}
              onChange={(event) => updateDraft({ subject: event.target.value })}
              placeholder="For example, Biology"
            />
          </label>

          <div className="question-list">
            {draft.questions.map((question, index) => (
              <fieldset className="question-editor" key={question.id}>
                <legend>Question {index + 1}</legend>
                <label className="field">
                  <span>Prompt</span>
                  <textarea
                    aria-label={`Question ${index + 1}`}
                    value={question.prompt}
                    onChange={(event) => {
                      const questions = draft.questions.map((candidate) =>
                        candidate.id === question.id
                          ? { ...candidate, prompt: event.target.value }
                          : candidate,
                      );
                      updateDraft({ questions });
                    }}
                    rows={2}
                  />
                </label>
                <label className="field">
                  <span>Explanation</span>
                  <textarea
                    aria-label={`Explanation ${index + 1}`}
                    value={question.explanation}
                    onChange={(event) => {
                      const questions = draft.questions.map((candidate) =>
                        candidate.id === question.id
                          ? { ...candidate, explanation: event.target.value }
                          : candidate,
                      );
                      updateDraft({ questions });
                    }}
                    rows={2}
                  />
                </label>
                {draft.questions.length > 1 && (
                  <button
                    className="text-button"
                    type="button"
                    onClick={() =>
                      updateDraft({
                        questions: draft.questions.filter(
                          (candidate) => candidate.id !== question.id,
                        ),
                      })
                    }
                  >
                    Remove question
                  </button>
                )}
              </fieldset>
            ))}
          </div>

          <div className="deck-editor-actions">
            <button className="secondary-button" type="button" onClick={onAddQuestion}>
              Add question
            </button>
            <button className="primary-button" type="submit">
              Save deck
            </button>
            {decks.some((deck) => deck.id === draft.id) && (
              <>
                <button className="secondary-button" type="button" onClick={() => onExport(draft)}>
                  Export deck
                </button>
                <button className="text-button" type="button" onClick={onDelete}>
                  Delete deck
                </button>
              </>
            )}
          </div>
        </form>
      ) : (
        <p className="empty-deck">
          Choose a deck to edit it, or create a new one for this subject.
        </p>
      )}
    </DeckLibraryScreen>
  );
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

      <BotanicalProgress garden={snapshot.garden} />

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

      <HistoryScreen summaries={snapshot.summaries} />

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
  const [confirmation, setConfirmation] = useState("");
  const confirmed = confirmation === "DELETE LOCAL DATA";

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
        <label className="field" htmlFor="delete-confirmation">
          <span>Type DELETE LOCAL DATA to continue</span>
          <input
            id="delete-confirmation"
            aria-label="Type DELETE LOCAL DATA"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
          />
        </label>
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Keep my data
          </button>
          <button className="danger-button" type="button" onClick={onConfirm} disabled={!confirmed}>
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
  camera?: CameraAdapter;
  cameraAdapter?: CameraAdapter;
  courseGuardBridge?: CourseGuardBridge;
  vision?: VisionClient;
  visionAdapter?: VisionClient;
};

export function App({
  repository: providedRepository,
  camera: providedCamera,
  cameraAdapter,
  courseGuardBridge: providedCourseGuardBridge,
  vision: providedVision,
  visionAdapter,
}: AppProps = {}) {
  const [form, setForm] = useState(initialConfig);
  const [session, setSession] = useState(() => createSessionState(initialConfig));
  const [snapshot, setSnapshot] = useState<RepositorySnapshot>(initialSnapshot);
  const [plazaState, setPlazaState] = useState(initialSnapshot.plaza);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deckDraft, setDeckDraft] = useState<QuestionDeck | null>(null);
  const [deckMessage, setDeckMessage] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [storageStatus, setStorageStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [studyToolsOpen, setStudyToolsOpen] = useState(false);
  const [courseGuardConnection, setCourseGuardConnection] = useState<"connected" | "disconnected">(
    "disconnected",
  );
  const [courseGuardState, setCourseGuardState] = useState<CourseGuardSnapshot | null>(null);
  const [courseGuardPermissionNeeded, setCourseGuardPermissionNeeded] = useState(false);
  const [courseGuardCommandStatus, setCourseGuardCommandStatus] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);
  const [courseGuardCommandPending, setCourseGuardCommandPending] = useState(false);
  const [courseUrl, setCourseUrl] = useState("");
  const [route, setRoute] = useState(() => parseHashRoute(window.location.hash));
  const courseGuardBridge = providedCourseGuardBridge ?? defaultCourseGuardBridge;
  const repositoryRef = useRef<DeepWorkRepository | null>(providedRepository ?? null);
  const hydratedRef = useRef(false);
  const plazaHydratedRef = useRef(false);
  const persistedPhaseRef = useRef<SessionState["phase"] | null>(null);
  const persistenceQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const pageHiddenRef = useRef(false);
  const focusStageRef = useRef<HTMLElement | null>(null);
  const courseGuardStateRef = useRef<CourseGuardSnapshot | null>(null);
  const handleAwarenessEvent = useCallback(
    (event: { atMs: number; signal: "gaze-down" | "head-away" | "face-absent" }) => {
      setSession((current) =>
        reduceSession(current, { type: "AWARENESS_EVENT", atMs: event.atMs, signal: event.signal }),
      );
      void playAwarenessChime({
        enabled: form.sound !== "silent",
        volume: form.sound === "standard" ? 0.7 : 0.35,
      });
    },
    [form.sound],
  );
  const activePreset: PresetName = form.preset ?? "balanced";
  const {
    allowCamera,
    cameraMode: activeCameraMode,
    chooseCamera,
    continueWithoutCamera,
    calibrationProgress,
    dismissAwareness,
    pageHidden: awarenessPaused,
    retryCamera,
    stage: cameraStage,
    startCalibration,
    videoRef: cameraVideoRef,
  } = useSessionController({
    camera: providedCamera ?? cameraAdapter,
    onAwarenessEvent: handleAwarenessEvent,
    preset: activePreset,
    vision: providedVision ?? visionAdapter,
  });

  const queuePersistence = useCallback(function queuePersistence<T>(
    operation: (repository: DeepWorkRepository) => Promise<T>,
    onError?: (error: unknown) => void,
  ): Promise<T | undefined> {
    const queued = persistenceQueueRef.current.then(async () => {
      const repository = repositoryRef.current;
      if (!repository) return undefined;
      try {
        return await operation(repository);
      } catch (error) {
        if (onError) onError(error);
        else setStorageStatus("unavailable");
        return undefined;
      }
    });
    persistenceQueueRef.current = queued.catch(() => undefined);
    return queued;
  }, []);

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
        setPlazaState(snapshot.plaza);
        plazaHydratedRef.current = true;
        setSelectedDeckId(snapshot.preferences.selectedDeckId);
        const selectedDeck = snapshot.decks.find(
          (deck) => deck.id === snapshot.preferences.selectedDeckId,
        );
        setDeckDraft(selectedDeck ? cloneQuestionDeck(selectedDeck) : null);
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
        setReducedMotion(snapshot.preferences.reducedMotion ?? false);
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
    if (!plazaHydratedRef.current || storageStatus === "unavailable") return;
    queuePersistence(async (repository) => {
      const nextSnapshot = await repository.savePlaza(plazaState);
      setSnapshot((current) => ({ ...current, plaza: nextSnapshot.plaza }));
      return nextSnapshot;
    });
  }, [plazaState, queuePersistence, storageStatus]);

  useEffect(() => {
    const updateRoute = () => setRoute(parseHashRoute(window.location.hash));
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

  useEffect(() => {
    return courseGuardBridge.connect((event: CourseGuardBridgeEvent) => {
      if (event.type === "connection") {
        setCourseGuardConnection(event.status);
        if (event.status === "disconnected") {
          courseGuardStateRef.current = null;
          setCourseGuardState(null);
          setCourseGuardPermissionNeeded(false);
          setCourseGuardCommandStatus(null);
          setPlazaState((current) =>
            reducePlazaState(current, { mood: "resting", type: "SET_MOOD" }),
          );
        }
      } else {
        const previous = courseGuardStateRef.current;
        courseGuardStateRef.current = event.state;
        setCourseGuardState(event.state);
        setCourseGuardPermissionNeeded(event.state.phase === "permission-lost");
        setPlazaState((current) => {
          let next = current;
          if (
            event.state.phase === "watching" &&
            (previous === null || previous.phase === "idle" || previous.phase === "permission-lost")
          ) {
            next = reducePlazaState(next, { type: "SESSION_STARTED" });
          } else if (event.state.phase === "interruption" && previous?.phase === "watching") {
            next = reducePlazaState(next, { type: "DISTRACTION_DETECTED" });
          } else if (
            event.state.phase === "watching" &&
            (previous?.phase === "interruption" ||
              (previous?.returnCount ?? 0) < event.state.returnCount)
          ) {
            next = reducePlazaState(next, { type: "RETURNED_TO_COURSE" });
          }

          const newSession = event.state.lastSession;
          const previousSessionId = previous?.lastSession?.id ?? null;
          if (newSession && newSession.id !== previousSessionId) {
            const outcome: CourseGuardSessionRecord = {
              ...newSession,
              courseLabel: (() => {
                try {
                  return new URL(newSession.courseOrigin).hostname;
                } catch {
                  return newSession.courseOrigin;
                }
              })(),
              growthPoints: 0,
              rewardId: null,
            };
            const terminalEvent: PlazaEvent =
              newSession.completionStatus === "completed"
                ? { outcome, type: "SESSION_COMPLETED" }
                : { outcome, type: "SESSION_ENDED" };
            next = reducePlazaState(next, terminalEvent);
          }

          if (!newSession) {
            next = reducePlazaState(next, {
              mood: companionMoodForGuardState({
                connection: "connected",
                phase: event.state.phase,
              }),
              type: "SET_MOOD",
            });
          } else if (event.state.phase === "permission-lost") {
            next = reducePlazaState(next, { mood: "encouraging", type: "SET_MOOD" });
          }
          return next;
        });
      }
    });
  }, [courseGuardBridge]);

  useEffect(() => {
    if (!hydratedRef.current || storageStatus === "unavailable") return;
    queuePersistence((repository) =>
      repository.savePreferences({
        durationMs: form.durationMs,
        preset: activePreset,
        reducedMotion,
        selectedDeckId,
        sound: form.sound,
      }),
    );
  }, [
    form.durationMs,
    activePreset,
    form.sound,
    queuePersistence,
    reducedMotion,
    selectedDeckId,
    storageStatus,
  ]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reducedMotion ? "true" : "false";
  }, [reducedMotion]);

  useEffect(() => {
    if (!hydratedRef.current || storageStatus === "unavailable") return;
    if (session.phase === "focus" && persistedPhaseRef.current === "focus") return;
    persistedPhaseRef.current = session.phase;

    if (
      session.phase === "focus" ||
      session.phase === "paused" ||
      session.phase === "notes-pause" ||
      session.phase === "gentle-reset" ||
      session.phase === "reflection"
    ) {
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

  useEffect(() => {
    if (awarenessPaused === pageHiddenRef.current) return;
    pageHiddenRef.current = awarenessPaused;
    setSession((current) =>
      reduceSession(current, {
        atMs: Date.now(),
        type: awarenessPaused ? "PAGE_HIDDEN" : "PAGE_VISIBLE",
      }),
    );
  }, [awarenessPaused]);

  const canStart =
    form.subject.trim().length > 0 &&
    form.goal.trim().length > 0 &&
    (activeCameraMode === "disabled" || cameraStage === "ready");
  const timeRemaining = remainingMs(session, nowMs);
  const normalizedCourseUrl = courseUrl.trim();
  const courseWebsite = courseGuardOriginFromUrl(normalizedCourseUrl);
  const canStartCourseGuard =
    courseGuardConnection === "connected" &&
    courseGuardState?.phase === "idle" &&
    isCourseGuardCourseUrl(normalizedCourseUrl) &&
    form.goal.trim().length > 0 &&
    !courseGuardCommandPending;

  async function startCourseGuard() {
    if (!canStartCourseGuard) return;
    setCourseGuardCommandPending(true);
    setCourseGuardCommandStatus(null);
    const result = await courseGuardBridge.startGuard(normalizedCourseUrl);
    if (result.ok) {
      setCourseGuardPermissionNeeded(false);
      setCourseGuardCommandStatus({
        kind: "success",
        text: "Course Guard started by the extension.",
      });
    } else {
      setCourseGuardPermissionNeeded(result.code === "permission-needed");
      setCourseGuardCommandStatus({ kind: "error", text: result.message });
      if (result.code === "disconnected") setCourseGuardConnection("disconnected");
    }
    setCourseGuardCommandPending(false);
  }

  async function stopCourseGuard() {
    if (courseGuardCommandPending) return;
    setCourseGuardCommandPending(true);
    setCourseGuardCommandStatus(null);
    const result = await courseGuardBridge.stopGuard();
    if (result.ok) {
      setCourseGuardPermissionNeeded(false);
      setCourseGuardCommandStatus({ kind: "success", text: "Course Guard stopped." });
    } else {
      setCourseGuardCommandStatus({ kind: "error", text: result.message });
      if (result.code === "disconnected") setCourseGuardConnection("disconnected");
    }
    setCourseGuardCommandPending(false);
  }

  function startSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canStart) return;

    const config: SessionConfig = {
      cameraMode: activeCameraMode,
      durationMs: form.durationMs,
      goal: form.goal.trim(),
      preset: activePreset,
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
    const outcome = plazaOutcomeFromCoreSession(session);
    if (outcome) {
      const event: PlazaEvent =
        outcome.completionStatus === "completed"
          ? { outcome, type: "SESSION_COMPLETED" }
          : { outcome, type: "SESSION_ENDED" };
      setPlazaState((current) => reducePlazaState(current, event));
    }
    dispatchEvent(setSession, { atMs: nowMs, type: "REFLECT", value });
  }

  function returnToPlaza() {
    setSession((current) => reduceSession(current, { type: "RESET" }));
    window.location.hash = "#/plaza";
  }

  function selectDeck(deckId: string | null) {
    setSelectedDeckId(deckId);
    setSnapshot((current) => ({
      ...current,
      preferences: { ...current.preferences, selectedDeckId: deckId },
    }));
    const selectedDeck = snapshot.decks.find((deck) => deck.id === deckId);
    setDeckDraft(selectedDeck ? cloneQuestionDeck(selectedDeck) : null);
    setDeckMessage(null);
  }

  function startNewDeck() {
    setDeckDraft(newQuestionDeck());
    setDeckMessage(null);
  }

  function addQuestionToDraft() {
    if (!deckDraft) return;
    setDeckDraft({
      ...deckDraft,
      questions: [
        ...deckDraft.questions,
        {
          explanation: "",
          id: `${deckDraft.id}-question-${newSessionId()}`,
          prompt: "",
        },
      ],
    });
  }

  async function saveDeckDraft() {
    if (!deckDraft) return;
    const draft = cloneQuestionDeck(deckDraft);
    const nextSnapshot = await queuePersistence(
      (repository) => repository.saveDeck(draft),
      (error) =>
        setDeckMessage({
          kind: "error",
          text: error instanceof Error ? error.message : "Question Deck could not be saved.",
        }),
    );
    if (!nextSnapshot) return;
    setSnapshot(nextSnapshot);
    setSelectedDeckId(draft.id);
    setDeckDraft(cloneQuestionDeck(draft));
    setDeckMessage({ kind: "success", text: "Question Deck saved on this device." });
  }

  async function deleteDeck() {
    if (!deckDraft) return;
    const deckId = deckDraft.id;
    const nextSnapshot = await queuePersistence(
      (repository) => repository.deleteDeck(deckId),
      (error) =>
        setDeckMessage({
          kind: "error",
          text: error instanceof Error ? error.message : "Question Deck could not be deleted.",
        }),
    );
    if (!nextSnapshot) return;
    setSnapshot(nextSnapshot);
    setSelectedDeckId(nextSnapshot.preferences.selectedDeckId);
    setDeckDraft(null);
    setDeckMessage({ kind: "success", text: "Question Deck deleted from this device." });
  }

  async function importDeck(file: File) {
    const content = await file.text();
    const nextSnapshot = await queuePersistence(
      (repository) => repository.importDeck(content),
      (error) =>
        setDeckMessage({
          kind: "error",
          text: error instanceof Error ? error.message : "Question Deck import could not be used.",
        }),
    );
    if (!nextSnapshot) return;
    const importedDeck = nextSnapshot.decks[nextSnapshot.decks.length - 1];
    setSnapshot(nextSnapshot);
    setDeckMessage({ kind: "success", text: "Question Deck imported on this device." });
    if (importedDeck) {
      setDeckDraft(cloneQuestionDeck(importedDeck));
      setSelectedDeckId(importedDeck.id);
    }
  }

  function exportDeck(deck: QuestionDeck) {
    const blob = new Blob([serializeQuestionDeck(deck)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${deck.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
    setDeleteStatus(null);
    persistedPhaseRef.current = "setup";
    setForm({ ...initialConfig });
    setCourseUrl("");
    setCourseGuardPermissionNeeded(false);
    setCourseGuardCommandStatus(null);
    setReducedMotion(false);
    setSettingsOpen(false);
    setSession(createSessionState(initialConfig));
    setSnapshot(initialSnapshot);
    setPlazaState(createInitialPlazaState());
    setSelectedDeckId(null);
    setDeckDraft(null);
    setDeckMessage(null);
    queuePersistence(
      async (repository) => {
        setSnapshot(await repository.deleteAllData());
        setDeleteStatus("Your local data was deleted from this device.");
      },
      () => setDeleteStatus("Local data could not be deleted. Try again."),
    );
  }

  function resetSettings() {
    setForm((current) => ({
      ...current,
      durationMs: initialConfig.durationMs,
      preset: "balanced",
      sound: initialConfig.sound,
    }));
    setReducedMotion(false);
  }

  if (route === "privacy" || route === "terms") {
    return (
      <main className="page-shell">
        <LegalScreen document={route} />
        <LegalFooter />
      </main>
    );
  }

  if (session.phase === "setup" && route === "plaza") {
    return (
      <PlazaHomeScreen
        companion={plazaState.companion}
        connection={courseGuardConnection}
        guardPhase={courseGuardState?.phase ?? "idle"}
        onCare={(action) =>
          setPlazaState((current) => reducePlazaState(current, { action, type: "CARE_ACTION" }))
        }
        onStartFocus={() => {
          window.location.hash = "#/course-guard";
        }}
        recentSessions={plazaState.courseGuardSessions}
      />
    );
  }

  if (session.phase === "setup" && route === "archive") {
    return <SessionArchiveScreen sessions={plazaState.courseGuardSessions} />;
  }

  if (session.phase === "setup" && route === "wardrobe") {
    return (
      <WardrobeScreen
        companion={plazaState.companion}
        onEquip={(cosmeticId) =>
          setPlazaState((current) =>
            reducePlazaState(current, { cosmeticId, type: "EQUIP_COSMETIC" }),
          )
        }
      />
    );
  }

  if (session.phase === "setup" && route === "town-hall") {
    return (
      <TownHallScreen connection={courseGuardConnection}>
        <SettingsScreen
          durationMs={form.durationMs}
          onDeleteData={() => setDeleteDialogOpen(true)}
          onDurationChange={(durationMs) => setForm((current) => ({ ...current, durationMs }))}
          onExportData={exportData}
          onPresetChange={(preset: PresetName) => setForm((current) => ({ ...current, preset }))}
          onReset={resetSettings}
          onSoundChange={(sound) => setForm((current) => ({ ...current, sound }))}
          onReducedMotionChange={setReducedMotion}
          preset={form.preset ?? "balanced"}
          reducedMotion={reducedMotion}
          sound={form.sound}
        />
        {deleteStatus && (
          <p className="data-status" role="status">
            {deleteStatus}
          </p>
        )}
        {deleteDialogOpen && (
          <DeleteDialog onCancel={() => setDeleteDialogOpen(false)} onConfirm={deleteAllData} />
        )}
      </TownHallScreen>
    );
  }

  if (session.phase === "setup" && route === "course-guard") {
    return (
      <CourseGuardScreen
        commandPending={courseGuardCommandPending}
        commandStatus={courseGuardCommandStatus}
        connection={courseGuardConnection}
        courseUrl={courseUrl}
        courseWebsite={courseWebsite}
        onCourseUrlChange={(value) => {
          setCourseUrl(value);
          setCourseGuardPermissionNeeded(false);
          setCourseGuardCommandStatus(null);
        }}
        onStart={() => void startCourseGuard()}
        onStop={() => void stopCourseGuard()}
        permissionNeeded={courseGuardPermissionNeeded}
        state={courseGuardState}
        startDisabled={!canStartCourseGuard}
      >
        <form className="plaza-form-panel plaza-study-form" onSubmit={startSession}>
          <div className="plaza-section-heading">
            <div>
              <p className="section-kicker">Study intention</p>
              <h2>Give this session a small direction</h2>
            </div>
          </div>
          <label className="field" htmlFor="plaza-subject">
            <span>Subject</span>
            <input
              id="plaza-subject"
              value={form.subject}
              onChange={(event) =>
                setForm((current) => ({ ...current, subject: event.target.value }))
              }
              placeholder="For example, SQL"
              autoComplete="off"
            />
          </label>
          <label className="field" htmlFor="plaza-study-goal">
            <span>Study goal</span>
            <textarea
              id="plaza-study-goal"
              aria-label="Plaza session goal"
              value={form.goal}
              onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
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
                    name="plaza-duration"
                    checked={form.durationMs === minutes * MINUTE}
                    onChange={() =>
                      setForm((current) => ({ ...current, durationMs: minutes * MINUTE }))
                    }
                  />
                  <span>{minutes} minutes</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button className="plaza-primary-button" type="submit" disabled={!canStart}>
            Begin focus session
          </button>
        </form>
      </CourseGuardScreen>
    );
  }

  if (session.phase === "setup") {
    return (
      <main className="page-shell">
        <section className="setup-layout" aria-labelledby="setup-title">
          <div className="intro-column">
            <div className="product-row">
              <p className="product-mark">Deep Work Companion</p>
              <button
                className="text-button settings-toggle"
                type="button"
                onClick={() => setSettingsOpen((open) => !open)}
              >
                {settingsOpen ? "Close settings" : "Open settings"}
              </button>
            </div>
            <nav className="legal-links" aria-label="Legal">
              <a href="#/privacy">Privacy Policy</a>
              <a href="#/terms">Terms of Use</a>
            </nav>
            <h1 id="setup-title">Make room for focused learning</h1>
            <p className="intro-copy">
              Choose one subject and one goal. The timer keeps the next study block clear.
            </p>
            <div className="mode-note" role="note">
              <span className="mode-note-label">Today&apos;s mode</span>
              <strong>
                {activeCameraMode === "enabled" ? "Private Camera Awareness" : "Timer-Only Session"}
              </strong>
              <span>
                {activeCameraMode === "enabled"
                  ? "Camera analysis stays on this device and can be stopped at any time."
                  : "No camera analysis is used in this session."}
              </span>
              {activeCameraMode === "disabled" ? (
                <>
                  <button
                    className="primary-button mode-choice-button"
                    type="button"
                    onClick={chooseCamera}
                  >
                    Use private camera awareness
                  </button>
                  <button
                    className="secondary-button mode-choice-button"
                    type="button"
                    onClick={continueWithoutCamera}
                  >
                    Continue without camera
                  </button>
                </>
              ) : (
                <button
                  className="secondary-button mode-choice-button"
                  type="button"
                  onClick={continueWithoutCamera}
                >
                  Continue without camera
                </button>
              )}
            </div>
            <CourseGuardConnectionStatus
              connection={courseGuardConnection}
              permissionNeeded={courseGuardPermissionNeeded}
              state={courseGuardState}
            />
            {activeCameraMode === "enabled" && (
              <section className="camera-setup-panel" aria-labelledby="camera-setup-title">
                <h2 id="camera-setup-title">Private camera awareness</h2>
                {cameraStage === "consent" && (
                  <>
                    <p>
                      Allow your laptop camera only if you want local awareness prompts during this
                      study block.
                    </p>
                    <button className="primary-button" type="button" onClick={allowCamera}>
                      Allow camera awareness
                    </button>
                  </>
                )}
                {(cameraStage === "starting" || cameraStage === "preparing") && (
                  <StaticSkeleton
                    label={
                      cameraStage === "preparing"
                        ? "Preparing private camera analysis"
                        : "Starting camera"
                    }
                  />
                )}
                {(cameraStage === "calibration" || cameraStage === "calibrating") && (
                  <CalibrationScreen
                    onContinueWithoutCamera={continueWithoutCamera}
                    onStart={startCalibration}
                    preparing={cameraStage === "calibrating"}
                    progress={calibrationProgress}
                  />
                )}
                {cameraStage === "ready" && (
                  <p role="status">Camera awareness is ready. Your baseline is set.</p>
                )}
                {cameraStage === "error" && (
                  <>
                    <p role="alert">
                      Camera awareness could not start. Your timer-only session is still available.
                    </p>
                    <button className="secondary-button" type="button" onClick={retryCamera}>
                      Retry camera awareness
                    </button>
                  </>
                )}
                {cameraVideoRef && (
                  <video
                    ref={cameraVideoRef}
                    className="camera-video"
                    muted
                    playsInline
                    aria-hidden="true"
                  />
                )}
              </section>
            )}
          </div>

          <form className="intention-form" onSubmit={startSession}>
            <section className="course-guard-panel" aria-labelledby="course-guard-title">
              <div className="form-heading">
                <h2 id="course-guard-title">Course Guard</h2>
                <p>Keep one online course easy to return to when another website pulls you away.</p>
              </div>
              <label className="field" htmlFor="course-url">
                <span>Course URL</span>
                <input
                  id="course-url"
                  type="url"
                  value={courseUrl}
                  onChange={(event) => {
                    setCourseUrl(event.target.value);
                    setCourseGuardPermissionNeeded(false);
                    setCourseGuardCommandStatus(null);
                  }}
                  placeholder="https://learn.example.com/lesson"
                  autoComplete="url"
                  inputMode="url"
                />
              </label>
              {normalizedCourseUrl && !isCourseGuardCourseUrl(normalizedCourseUrl) && (
                <p className="course-guard-command-error" role="alert">
                  Enter a valid HTTP(S) Course URL.
                </p>
              )}
              {courseWebsite && (
                <p className="course-website" role="status">
                  Course Website: <strong>{courseWebsite}</strong>
                </p>
              )}
              <div className="course-guard-actions">
                {courseGuardState?.phase === "watching" ||
                courseGuardState?.phase === "interruption" ? (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => void stopCourseGuard()}
                    disabled={courseGuardCommandPending || courseGuardConnection === "disconnected"}
                  >
                    Stop Course Guard
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => void startCourseGuard()}
                    disabled={!canStartCourseGuard}
                  >
                    Start Course Guard
                  </button>
                )}
              </div>
              {courseGuardCommandStatus && (
                <p
                  className={`course-guard-command-${courseGuardCommandStatus.kind}`}
                  role={courseGuardCommandStatus.kind === "error" ? "alert" : "status"}
                >
                  {courseGuardCommandStatus.text}
                </p>
              )}
            </section>
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

            <label className="field" htmlFor="study-goal">
              <span>Study goal</span>
              <textarea
                id="study-goal"
                aria-label="Session goal"
                value={form.goal}
                onChange={(event) =>
                  setForm((current) => ({ ...current, goal: event.target.value }))
                }
                placeholder="What would you like to understand or finish?"
                rows={3}
              />
            </label>
            <label className="sr-only" htmlFor="study-goal">
              Session goal
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
              Begin focus session
            </button>
            <button className="sr-only" type="submit" disabled={!canStart}>
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
        <button
          className="text-button study-tools-toggle"
          type="button"
          aria-expanded={studyToolsOpen}
          onClick={() => setStudyToolsOpen((open) => !open)}
        >
          {studyToolsOpen ? "Hide study tools" : "More study tools"}
        </button>
        {settingsOpen && (
          <SettingsScreen
            durationMs={form.durationMs}
            onDeleteData={() => setDeleteDialogOpen(true)}
            onDurationChange={(durationMs) => setForm((current) => ({ ...current, durationMs }))}
            onExportData={exportData}
            onPresetChange={(preset: PresetName) => setForm((current) => ({ ...current, preset }))}
            onReset={resetSettings}
            onSoundChange={(sound) => setForm((current) => ({ ...current, sound }))}
            onReducedMotionChange={setReducedMotion}
            preset={form.preset ?? "balanced"}
            reducedMotion={reducedMotion}
            sound={form.sound}
          />
        )}
        {deleteStatus && (
          <p className="data-status" role="status">
            {deleteStatus}
          </p>
        )}
        {studyToolsOpen && (
          <>
            <DeckWorkspace
              decks={snapshot.decks}
              draft={deckDraft}
              message={deckMessage}
              onAddQuestion={addQuestionToDraft}
              onDelete={deleteDeck}
              onDraftChange={setDeckDraft}
              onExport={exportDeck}
              onImport={importDeck}
              onNew={startNewDeck}
              onSave={saveDeckDraft}
              onSelect={selectDeck}
              selectedDeckId={selectedDeckId}
            />
            <ProgressShelf
              onDelete={() => setDeleteDialogOpen(true)}
              onExport={exportData}
              snapshot={snapshot}
            />
          </>
        )}
        {deleteDialogOpen && (
          <DeleteDialog onCancel={() => setDeleteDialogOpen(false)} onConfirm={deleteAllData} />
        )}
        <LegalFooter />
      </main>
    );
  }

  if (session.phase === "gentle-reset") {
    return (
      <main className="page-shell">
        <section
          ref={focusStageRef}
          className="focus-stage"
          aria-labelledby="focus-title"
          tabIndex={-1}
        >
          <header className="focus-header">
            <div>
              <p className="product-mark">Deep Work Companion</p>
              <p className="focus-subject">{session.config.subject}</p>
            </div>
            <span className="status-label">Awareness event {session.awarenessCount}</span>
          </header>
          <div className="focus-main">
            <p className="focus-kicker">One thing for now</p>
            <h1 id="focus-title">Focus Stage</h1>
            <p className="focus-goal">{session.config.goal}</p>
            <time
              className="timer"
              role="timer"
              dateTime={`PT${Math.ceil(timeRemaining / 1_000)}S`}
              aria-label={`${formatDuration(timeRemaining)} remaining`}
            >
              {formatDuration(timeRemaining)}
            </time>
            <p className="timer-caption">Session paused for a reset</p>
          </div>
          <GentleResetDialog
            focusTargetRef={focusStageRef}
            onContinue={() => {
              dismissAwareness();
              dispatchEvent(setSession, { type: "CONTINUE_STUDYING", atMs: Date.now() });
            }}
            onNotes={() => {
              dismissAwareness();
              dispatchEvent(setSession, { type: "TAKING_NOTES", atMs: Date.now() });
            }}
            onQuickReview={() => {
              dismissAwareness();
              dispatchEvent(setSession, { type: "OPEN_QUICK_REVIEW", atMs: Date.now() });
            }}
            open
          />
        </section>
        <LegalFooter />
      </main>
    );
  }

  if (session.phase === "quick-review") {
    const selectedDeck = snapshot.decks.find((deck) => deck.id === selectedDeckId);
    const reviewCard = selectedDeck?.questions[0];
    return (
      <main className="page-shell">
        <QuickReviewScreen
          onComplete={() =>
            dispatchEvent(setSession, { type: "COMPLETE_REVIEW", atMs: Date.now() })
          }
          {...(reviewCard?.explanation ? { explanation: reviewCard.explanation } : {})}
          prompt={
            reviewCard?.prompt ??
            "State the next step you can explain without looking at your notes."
          }
        />
        <LegalFooter />
      </main>
    );
  }

  if (session.phase === "focus" || session.phase === "paused" || session.phase === "notes-pause") {
    const isPaused = session.phase === "paused";
    return (
      <main className="page-shell">
        <section className="focus-stage" aria-labelledby="focus-title">
          <header className="focus-header">
            <div>
              <p className="product-mark">Deep Work Companion</p>
              <p className="focus-subject">{session.config.subject}</p>
            </div>
            <span className="status-label">
              {activeCameraMode === "disabled"
                ? "Camera awareness is off"
                : `Awareness events: ${session.awarenessCount}`}
              <span className="sr-only">Timer-Only Session</span>
            </span>
          </header>

          <div className="focus-main">
            <p className="focus-kicker">One thing for now</p>
            <h1 id="focus-title">Focus Stage</h1>
            <p className="focus-goal">{session.config.goal}</p>
            <time
              className="timer"
              role="timer"
              dateTime={`PT${Math.ceil(timeRemaining / 1_000)}S`}
              aria-label={`${formatDuration(timeRemaining)} remaining`}
            >
              {formatDuration(timeRemaining)}
            </time>
            <p className="timer-caption">
              {session.phase === "notes-pause"
                ? "Notes pause - awareness is off"
                : isPaused
                  ? "Session paused"
                  : awarenessPaused
                    ? "Awareness paused - keep this window visible"
                    : "Time remaining"}
            </p>
          </div>

          <div className="focus-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                dispatchEvent(setSession, {
                  type: isPaused || session.phase === "notes-pause" ? "RESUME" : "PAUSE",
                  atMs: Date.now(),
                })
              }
            >
              {isPaused || session.phase === "notes-pause" ? "Resume session" : "Pause session"}
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
        <LegalFooter />
      </main>
    );
  }

  if (session.phase === "reflection") {
    return (
      <main className="page-shell">
        <ReflectionScreen
          awarenessCount={session.awarenessCount}
          focusTimeLabel={formatDuration(session.elapsedMs)}
          goal={session.config.goal}
          onReflect={chooseReflection}
          quickReviewCompleted={session.quickReviewCompleted}
          subject={session.config.subject}
        />
        <LegalFooter />
      </main>
    );
  }

  const outcome = plazaOutcomeFromCoreSession(session);
  const earnedGrowth = outcome ? rewardForSession(outcome).growthPoints : 0;
  const upcomingUnlock = nextUnlock({
    growthPoints: plazaState.companion.growthPoints,
    unlockedCosmeticIds: plazaState.companion.unlockedCosmeticIds,
  });
  const rewardCount = plazaState.courseGuardSessions.filter(
    (record) => record.rewardId !== null,
  ).length;

  return (
    <>
      <SessionRewardScreen
        companion={plazaState.companion}
        earnedGrowth={earnedGrowth}
        goal={session.config.goal}
        nextUnlock={upcomingUnlock}
        onReturnToPlaza={returnToPlaza}
        reflection={reflectionLabel(session.reflection ?? "not-yet")}
        rewardCount={rewardCount}
        savedLocally={storageStatus === "ready"}
        subject={session.config.subject}
      />
      <ProgressShelf
        onDelete={() => setDeleteDialogOpen(true)}
        onExport={exportData}
        snapshot={snapshot}
      />
      {deleteDialogOpen && (
        <DeleteDialog onCancel={() => setDeleteDialogOpen(false)} onConfirm={deleteAllData} />
      )}
      <LegalFooter />
    </>
  );
}
