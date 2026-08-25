import type { SessionSummary } from "../../storage/repository";

type HistoryScreenProps = {
  summaries: SessionSummary[];
  title?: string;
};

function reflectionLabel(value: NonNullable<SessionSummary["reflection"]>): string {
  return value === "not-yet" ? "Not yet" : value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDuration(elapsedMs: number): string {
  const minutes = Math.max(1, Math.round(elapsedMs / 60_000));
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

export function HistoryScreen({ summaries, title = "Session history" }: HistoryScreenProps) {
  return (
    <div className="history-panel" aria-labelledby="history-title">
      <div className="history-heading">
        <h3 id="history-title">{title}</h3>
        <p>Only subjects, goals, timing, reflections, and session status are kept here.</p>
      </div>
      {summaries.length > 0 ? (
        <ol className="history-list">
          {[...summaries].reverse().map((summary) => (
            <li key={summary.sessionId}>
              <div className="history-main">
                <strong>{summary.subject}</strong>
                <span>{summary.goal}</span>
              </div>
              <div className="history-meta">
                <span>{summary.finishReason === "completed" ? "Completed" : "Ended early"}</span>
                <span>{formatDuration(summary.elapsedMs)}</span>
                {summary.reflection && (
                  <span>Reflection: {reflectionLabel(summary.reflection)}</span>
                )}
                {summary.quickReviewCompleted && <span>Quick Review completed</span>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-progress">Complete a session to add its summary here.</p>
      )}
    </div>
  );
}
