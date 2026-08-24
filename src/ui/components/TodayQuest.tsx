import type { CosmeticDefinition } from "../../plaza/plaza-rewards";

export interface TodayQuestProps {
  growthPoints: number;
  unlock: CosmeticDefinition | null;
}

export function TodayQuest({ growthPoints, unlock }: TodayQuestProps) {
  const progress = unlock ? Math.min(growthPoints, unlock.requiredGrowthPoints) : 100;
  const progressMax = unlock?.requiredGrowthPoints ?? 100;

  return (
    <section aria-label="Today's quest" className="momo-today-quest">
      <div>
        <p className="section-kicker">Today&apos;s quest</p>
        <h2 id="today-quest-title">Grow Momo with Course Guard</h2>
      </div>
      <p className="momo-quest-copy">Complete a Course Guard session to grow Momo.</p>
      <div className="momo-quest-progress">
        <span>{unlock ? `Next unlock: ${unlock.label}` : "Every reward is unlocked"}</span>
        <strong>{unlock ? `${progress} / ${unlock.requiredGrowthPoints}` : "Complete"}</strong>
        <progress
          aria-label={unlock ? `${unlock.label} unlock progress` : "All rewards unlocked"}
          max={progressMax}
          value={progress}
        />
      </div>
    </section>
  );
}
