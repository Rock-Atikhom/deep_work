import type { Reflection } from "../../session/session-machine";

type ReflectionScreenProps = {
  awarenessCount: number;
  focusTimeLabel: string;
  goal: string;
  onReflect: (value: Reflection) => void;
  quickReviewCompleted: boolean;
  subject: string;
};

export function ReflectionScreen({
  awarenessCount,
  focusTimeLabel,
  goal,
  onReflect,
  quickReviewCompleted,
  subject,
}: ReflectionScreenProps) {
  return (
    <section className="reflection-card" aria-labelledby="reflection-title">
      <p className="product-mark">Deep Work Companion</p>
      <h1 id="reflection-title">Reflect on this session</h1>
      <p className="reflection-subject">{subject}</p>
      <p className="reflection-goal">{goal}</p>
      <dl className="reflection-facts">
        <div>
          <dt>Focus time</dt>
          <dd>{focusTimeLabel}</dd>
        </div>
        <div>
          <dt>Awareness events</dt>
          <dd>{awarenessCount}</dd>
        </div>
        <div>
          <dt>Quick Review</dt>
          <dd>{quickReviewCompleted ? "Completed" : "Not used"}</dd>
        </div>
      </dl>
      <p className="reflection-prompt">Did you complete your goal?</p>
      <div className="reflection-actions">
        {(["yes", "partly", "not-yet"] as const).map((value) => (
          <button
            className="reflection-button"
            key={value}
            type="button"
            onClick={() => onReflect(value)}
          >
            {value === "not-yet" ? "Not yet" : value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      <p className="reflection-note">Your answer is for your own review. It is not a score.</p>
    </section>
  );
}
