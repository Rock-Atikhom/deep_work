import type { CourseGuardSessionRecord } from "../../plaza/plaza-types";

export interface SessionArchiveScreenProps {
  sessions: CourseGuardSessionRecord[];
}

function durationLabel(elapsedMs: number): string {
  const minutes = Math.floor(elapsedMs / 60_000);
  return `${minutes} min`;
}

export function SessionArchiveScreen({ sessions }: SessionArchiveScreenProps) {
  return (
    <main className="plaza-inner-screen" aria-labelledby="archive-title">
      <header className="plaza-inner-header">
        <a href="#/plaza">← Plaza</a>
        <div>
          <p className="plaza-eyebrow">Session Archive</p>
          <h1 id="archive-title">Your learning shelf</h1>
        </div>
      </header>
      <section className="archive-panel">
        {sessions.length === 0 ? (
          <div className="plaza-empty-state">
            <div className="plaza-empty-icon" aria-hidden="true">
              ✦
            </div>
            <h2>No sessions on the shelf yet</h2>
            <p>Complete a protected course session and its reward will settle here.</p>
            <a className="plaza-primary-button" href="#/course-guard">
              Visit Course Guard
            </a>
          </div>
        ) : (
          <ul className="archive-list">
            {sessions
              .slice()
              .reverse()
              .map((session) => (
                <li className="archive-list-item" key={session.id}>
                  <div>
                    <strong>{session.courseLabel}</strong>
                    <span>{new Date(session.startedAtMs).toLocaleDateString()}</span>
                  </div>
                  <div className="archive-list-meta">
                    <span>{durationLabel(session.elapsedMs)}</span>
                    <span>{session.returnCount} returns</span>
                    <strong>+{session.growthPoints} growth</strong>
                  </div>
                  <span className={`archive-status archive-status-${session.completionStatus}`}>
                    {session.completionStatus === "completed" ? "Completed" : "Incomplete"}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  );
}
