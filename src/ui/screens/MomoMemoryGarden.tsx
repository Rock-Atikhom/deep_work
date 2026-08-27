import type { RepositorySnapshot } from "../../storage/repository";
import { MomoSproutPlanter } from "../components/MomoSproutPlanter";
import { HistoryScreen } from "./HistoryScreen";

export type MomoMemoryGardenProps = {
  onClearHistory: () => void;
  onDelete: () => void;
  onExport: () => void;
  snapshot: RepositorySnapshot;
};

function gardenStageLabel(stage: "sprout" | "leaf" | "bloom"): string {
  return stage === "bloom" ? "Bloom" : stage === "leaf" ? "Leaf" : "Sprout";
}

export function MomoMemoryGarden({
  onClearHistory,
  onDelete,
  onExport,
  snapshot,
}: MomoMemoryGardenProps) {
  const sproutCount = snapshot.garden.plants.length;

  return (
    <section className="momo-memory-garden" aria-labelledby="momo-memory-garden-title">
      <header className="momo-memory-garden-header">
        <div>
          <p className="momo-memory-garden-kicker">Private keepsakes</p>
          <h2 id="momo-memory-garden-title">Momo&apos;s Memory Garden</h2>
          <p>Your private keepsakes from growing focus habits.</p>
        </div>
        <span className="momo-sprout-count">
          {sproutCount} sprout{sproutCount === 1 ? "" : "s"}
        </span>
      </header>

      <div className="momo-memory-garden-grid">
        <MomoSproutPlanter garden={snapshot.garden} />

        <section className="momo-collected-sprouts" aria-labelledby="momo-collected-sprouts-title">
          <h3 id="momo-collected-sprouts-title">Collected sprouts</h3>
          {snapshot.garden.plants.length > 0 ? (
            <ul className="momo-collected-sprout-list">
              {snapshot.garden.plants.map((plant) => (
                <li key={plant.sessionId}>
                  <span
                    className={`momo-collected-sprout-stage momo-collected-sprout-stage-${plant.stage}`}
                  >
                    {gardenStageLabel(plant.stage)}
                  </span>
                  <span>{plant.subject}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="momo-empty-sprouts">
              <span className="momo-empty-sprouts-mark" aria-hidden="true">
                ✦
              </span>
              <h4>Your first sprout is waiting</h4>
              <p>Complete a focus session and choose a reflection to grow it here.</p>
              <a className="momo-empty-sprouts-link" href="#/plaza">
                Start a focus session
              </a>
            </div>
          )}
        </section>
      </div>

      <HistoryScreen summaries={snapshot.summaries} title="Quest Log" />

      <div className="momo-device-keepsakes" aria-label="Device keepsakes controls">
        <button className="momo-export-button" type="button" onClick={onExport}>
          Export my data
        </button>
        <button
          className="momo-export-button"
          type="button"
          onClick={onClearHistory}
          disabled={snapshot.plaza.courseGuardSessions.length === 0}
        >
          Clear session history
        </button>
        <button className="momo-delete-button" type="button" onClick={onDelete}>
          Delete my data
        </button>
      </div>
    </section>
  );
}
