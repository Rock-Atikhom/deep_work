import type { CSSProperties, JSX } from "react";
import type { GardenState } from "../../garden/garden";

type MomoSproutPlanterProps = { garden: GardenState };

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: "1rem",
  alignItems: "center",
  gridTemplateColumns: "minmax(0, 220px) minmax(0, 1fr)",
  padding: "1rem",
  border: "3px solid var(--momo-ink)",
  borderRadius: "24px",
  background:
    "linear-gradient(180deg, color-mix(in srgb, var(--momo-sky) 70%, white) 0%, var(--momo-cream) 100%)",
  boxShadow: "5px 5px 0 var(--momo-shadow)",
  color: "var(--momo-ink)",
};

const artFrameStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  aspectRatio: "1 / 1",
  padding: "0.5rem",
  border: "2px solid var(--momo-ink)",
  borderRadius: "20px",
  background:
    "radial-gradient(circle at top, color-mix(in srgb, var(--momo-cream) 85%, white) 0%, var(--momo-sky) 100%)",
};

const svgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  overflow: "visible",
};

const copyStyle: CSSProperties = {
  display: "grid",
  gap: "0.35rem",
};

const kickerStyle: CSSProperties = {
  margin: 0,
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const strongStyle: CSSProperties = {
  fontSize: "1.8rem",
  lineHeight: 1.1,
};

const detailStyle: CSSProperties = {
  fontSize: "0.98rem",
};

const navyStroke = "var(--momo-ink)";

export function MomoSproutPlanter({ garden }: MomoSproutPlanterProps): JSX.Element {
  const totalSeeds =
    garden.totalSeeds ?? garden.plants.reduce((sum, plant) => sum + plant.seeds, 0);
  const latestStage = garden.plants.at(-1)?.stage ?? "sprout";
  const sessionCount = garden.plants.length;

  return (
    <section aria-labelledby="momo-sprout-progress-title" style={sectionStyle}>
      <div style={artFrameStyle}>
        <svg
          role="img"
          aria-label={`Momo sprout planter, round friend tending a seedling with ${totalSeeds} permanent seeds`}
          viewBox="0 0 220 205"
          style={svgStyle}
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
      <div style={copyStyle}>
        <p id="momo-sprout-progress-title" style={kickerStyle}>
          Garden keepsake
        </p>
        <strong style={strongStyle}>{totalSeeds} seeds</strong>
        <span style={detailStyle}>
          {sessionCount} {sessionCount === 1 ? "session" : "sessions"} recorded
        </span>
        <span style={detailStyle}>Latest stage: {latestStage}</span>
      </div>
    </section>
  );
}
