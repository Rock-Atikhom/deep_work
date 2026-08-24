import type { RepositorySnapshot } from "../../storage/repository";
import { MomoSproutPlanter } from "../components/MomoSproutPlanter";
import { HistoryScreen } from "./HistoryScreen";

export type MomoMemoryGardenProps = {
  onDelete: () => void;
  onExport: () => void;
  snapshot: RepositorySnapshot;
};

function gardenStageLabel(stage: "sprout" | "leaf" | "bloom"): string {
  return stage === "bloom" ? "Bloom" : stage === "leaf" ? "Leaf" : "Sprout";
}

export function MomoMemoryGarden({
  onDelete,
  onExport,
  snapshot,
}: MomoMemoryGardenProps) {
  const sproutCount = snapshot.garden.plants.length;

  return (
    <section className="progress-shelf momo-memory-garden" aria-labelledby="momo-memory-garden-title">
      <div className="progress-header momo-memory-garden-header">
        <div>
          <p className="section-kicker">Private keepsakes</p>
          <h2 id="momo-memory-garden-title">Momo&apos;s Memory Garden</h2>
          <p>Your private keepsakes from growing focus habits.</p>
        </div>
        <p className="garden-count momo-sprout-count">
          {sproutCount} sprout{sproutCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="momo-memory-garden-grid">
        <MomoSproutPlanter garden={snapshot.garden} />

        <section className="momo-collected-sprouts" aria-labelledby="momo-collected-sprouts-title">
          <h3 id="momo-collected-sprouts-title">Collected sprouts</h3>
          {snapshot.garden.plants.length > 0 ? (
            <ul className="garden-list momo-collected-sprout-list">
              {snapshot.garden.plants.map((plant) => (
                <li key={plant.sessionId}>
                  <span
                    className={`garden-stage momo-collected-sprout-stage momo-collected-sprout-stage-${plant.stage}`}
                  >
                    {gardenStageLabel(plant.stage)}
                  </span>
                  <span>{plant.subject}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-progress momo-empty-progress">No completed sessions yet.</p>
          )}
        </section>
      </div>

      <HistoryScreen summaries={snapshot.summaries} title="Quest Log" />

      <div className="data-actions momo-device-keepsakes" aria-label="Device keepsakes controls">
        <button className="secondary-button momo-export-button" type="button" onClick={onExport}>
          Export my data
        </button>
        <button className="text-button momo-delete-button" type="button" onClick={onDelete}>
          Delete my data
        </button>
      </div>
    </section>
  );
}
