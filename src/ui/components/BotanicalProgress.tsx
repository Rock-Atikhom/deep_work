import type { GardenState } from "../../garden/garden";

type BotanicalProgressProps = { garden: GardenState };

export function BotanicalProgress({ garden }: BotanicalProgressProps) {
  const totalSeeds =
    garden.totalSeeds ?? garden.plants.reduce((sum, plant) => sum + plant.seeds, 0);
  const stageLabel = garden.plants.at(-1)?.stage ?? "sprout";

  return (
    <div className="botanical-progress" aria-labelledby="botanical-progress-title">
      <div className="botanical-art-wrap">
        <svg
          className="botanical-art"
          role="img"
          aria-label={`Learning Garden botanical progress, ${totalSeeds} permanent seeds`}
          viewBox="0 0 180 140"
        >
          <path d="M90 128V54" />
          <path d="M90 92C72 82 60 68 58 50" />
          <path d="M90 78C108 68 120 54 122 36" />
          <path d="M90 108C72 104 58 106 45 116" />
          <path d="M90 108C108 104 122 106 135 116" />
          <path d="M58 50C46 46 38 38 36 26C48 26 58 32 58 50Z" />
          <path d="M122 36C134 32 144 24 146 12C134 12 124 18 122 36Z" />
          <path d="M45 116C34 116 25 122 20 132C32 134 42 128 45 116Z" />
          <path d="M135 116C146 116 155 122 160 132C148 134 138 128 135 116Z" />
        </svg>
      </div>
      <div className="botanical-copy">
        <p id="botanical-progress-title" className="section-kicker">
          Permanent progress
        </p>
        <strong>{totalSeeds} seeds</strong>
        <span>
          {garden.plants.length} {garden.plants.length === 1 ? "session" : "sessions"} recorded
        </span>
        <span>Latest stage: {stageLabel}</span>
      </div>
    </div>
  );
}
