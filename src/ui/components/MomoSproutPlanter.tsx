import type { JSX } from "react";
import type { GardenState } from "../../garden/garden";

type MomoSproutPlanterProps = { garden: GardenState };

const navyStroke = "var(--momo-ink)";

export function MomoSproutPlanter({ garden }: MomoSproutPlanterProps): JSX.Element {
  const totalSeeds =
    garden.totalSeeds ?? garden.plants.reduce((sum, plant) => sum + plant.seeds, 0);
  const latestStage = garden.plants.at(-1)?.stage ?? "sprout";
  const sessionCount = garden.plants.length;

  return (
    <section className="momo-sprout-planter" aria-labelledby="momo-sprout-progress-title">
      <div className="momo-sprout-planter-art">
        <svg
          className="momo-sprout-planter-svg"
          role="img"
          aria-label={`Momo sprout planter, round friend tending a seedling with ${totalSeeds} permanent seeds`}
          viewBox="0 0 220 205"
        >
          <path
            d="M108 57C83 21 45 27 45 54c32 4 50 24 63 48"
            fill="var(--momo-leaf)"
            stroke={navyStroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            d="M116 58c27-37 65-28 63 0-29 7-48 27-60 48"
            fill="var(--momo-leaf)"
            stroke={navyStroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            d="M108 152V84"
            fill="none"
            stroke={navyStroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            d="M55 125h110l-12 55H67z"
            fill="var(--momo-pink)"
            stroke={navyStroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <circle
            cx="110"
            cy="117"
            r="47"
            fill="var(--momo-lemon)"
            stroke="var(--momo-ink)"
            strokeWidth="4"
          />
          <ellipse
            cx="110"
            cy="127"
            rx="29"
            ry="22"
            fill="var(--momo-cream)"
            stroke="var(--momo-ink)"
            strokeWidth="4"
          />
          <circle cx="98" cy="125" r="4" fill="var(--momo-ink)" />
          <circle cx="122" cy="125" r="4" fill="var(--momo-ink)" />
          <path
            d="M103 138q7 7 14 0"
            fill="none"
            stroke={navyStroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        </svg>
      </div>
      <div className="momo-sprout-planter-copy">
        <p id="momo-sprout-progress-title" className="momo-sprout-planter-kicker">
          Garden keepsake
        </p>
        <strong className="momo-sprout-planter-total">{totalSeeds} seeds</strong>
        <span className="momo-sprout-planter-detail">
          {sessionCount} {sessionCount === 1 ? "session" : "sessions"} recorded
        </span>
        <span className="momo-sprout-planter-detail">Latest stage: {latestStage}</span>
      </div>
    </section>
  );
}
