type FocusScreenProps = {
  subject: string;
  goal: string;
  timeLabel: string;
  remainingMs: number;
  awarenessEnabled: boolean;
  awarenessCount: number;
  paused: boolean;
  onPause: () => void;
  onEnd: () => void;
};

export function FocusScreen({
  subject,
  goal,
  timeLabel,
  remainingMs,
  awarenessEnabled,
  awarenessCount,
  paused,
  onPause,
  onEnd,
}: FocusScreenProps) {
  return (
    <section className="focus-stage" aria-labelledby="focus-title">
      <header className="focus-header">
        <div>
          <p className="product-mark">Deep Work Companion</p>
          <p className="focus-subject">{subject}</p>
        </div>
        <span className="status-label">
          {awarenessEnabled ? `Awareness events: ${awarenessCount}` : "Camera awareness is off"}
        </span>
      </header>
      <div className="focus-main">
        <p className="focus-kicker">One thing for now</p>
        <h1 id="focus-title">Focus Stage</h1>
        <p className="focus-goal">{goal}</p>
        <time
          className="timer"
          role="timer"
          dateTime={`PT${Math.ceil(remainingMs / 1_000)}S`}
          aria-label={`${timeLabel} remaining`}
        >
          {timeLabel}
        </time>
        <p className="timer-caption">{paused ? "Session paused" : "Time remaining"}</p>
      </div>
      <div className="focus-actions">
        <button className="secondary-button" type="button" onClick={onPause}>
          {paused ? "Resume session" : "Pause session"}
        </button>
        <button className="text-button" type="button" onClick={onEnd}>
          End session
        </button>
      </div>
    </section>
  );
}
