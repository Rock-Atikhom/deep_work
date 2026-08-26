import type { ReactNode } from "react";
import type { CourseGuardSnapshot } from "../../course-guard/bridge-contract";

export interface CourseGuardScreenProps {
  children?: ReactNode;
  commandPending: boolean;
  commandStatus: { kind: "error" | "success"; text: string } | null;
  connection: "connected" | "disconnected";
  courseUrl: string;
  courseWebsite: string | null;
  onCourseUrlChange: (value: string) => void;
  onStart: () => void;
  onStop: () => void;
  permissionNeeded: boolean;
  state: CourseGuardSnapshot | null;
  startDisabled: boolean;
}

function statusLabel(
  connection: CourseGuardScreenProps["connection"],
  state: CourseGuardSnapshot | null,
  permissionNeeded: boolean,
): string {
  if (connection === "disconnected") return "Extension disconnected";
  if (permissionNeeded || state?.phase === "permission-lost") return "Permission needed";
  if (state?.phase === "watching") return "Guarding course";
  if (state?.phase === "interruption") return "Return to course";
  return "Extension connected";
}

export function CourseGuardScreen({
  children,
  commandPending,
  commandStatus,
  connection,
  courseUrl,
  courseWebsite,
  onCourseUrlChange,
  onStart,
  onStop,
  permissionNeeded,
  state,
  startDisabled,
}: CourseGuardScreenProps) {
  const active = state?.phase === "watching" || state?.phase === "interruption";
  return (
    <main
      className="plaza-inner-screen momo-course-guard"
      aria-labelledby="course-guard-screen-title"
    >
      <header className="plaza-inner-header">
        <a href="#/plaza">← Plaza</a>
        <div>
          <p className="plaza-eyebrow">Course Guard station</p>
          <h1 id="course-guard-screen-title">Keep one course close</h1>
        </div>
        <span className={`plaza-status-pill plaza-status-${state?.phase ?? "idle"}`}>
          {statusLabel(connection, state, permissionNeeded)}
        </span>
      </header>

      <section className="plaza-form-panel" aria-labelledby="course-guard-form-title">
        <div className="plaza-section-heading">
          <div>
            <p className="section-kicker">Course door</p>
            <h2 id="course-guard-form-title">Where are you learning?</h2>
          </div>
          <span className="plaza-count-badge">{state?.returnCount ?? 0} returns</span>
        </div>
        <label className="field" htmlFor="course-url">
          <span>Course URL</span>
          <input
            id="course-url"
            type="url"
            value={courseUrl}
            onChange={(event) => onCourseUrlChange(event.target.value)}
            placeholder="https://learn.example.com/lesson"
            autoComplete="url"
            inputMode="url"
          />
        </label>
        {courseWebsite && (
          <p className="course-website" role="status">
            Course website: <strong>{courseWebsite}</strong>
          </p>
        )}
        <div className="course-guard-actions">
          {active ? (
            <button
              className="plaza-secondary-button"
              type="button"
              onClick={onStop}
              disabled={commandPending || connection === "disconnected"}
            >
              Stop Course Guard
            </button>
          ) : (
            <button
              className="plaza-primary-button"
              type="button"
              onClick={onStart}
              disabled={startDisabled}
            >
              Start Course Guard
            </button>
          )}
        </div>
        {commandStatus && (
          <p
            className={`course-guard-command-${commandStatus.kind}`}
            role={commandStatus.kind === "error" ? "alert" : "status"}
          >
            {commandStatus.text}
          </p>
        )}
        {connection === "disconnected" && (
          <p className="plaza-recovery-copy">
            Open the Course Guard extension to connect this course door.
          </p>
        )}
        {permissionNeeded && (
          <p className="plaza-recovery-copy">
            Allow this course website from the extension popup, then try again.
          </p>
        )}
      </section>

      {children}
    </main>
  );
}
