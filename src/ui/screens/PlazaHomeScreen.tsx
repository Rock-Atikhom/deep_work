import type { AppRoute } from "../../app/hash-route";
import { nextUnlock } from "../../plaza/plaza-rewards";
import type {
  CompanionMood,
  CompanionState,
  CourseGuardSessionRecord,
} from "../../plaza/plaza-types";
import { FocusFriend } from "../components/FocusFriend";
import { PlazaDestinationCard } from "../components/PlazaDestinationCard";
import { PlazaMeter } from "../components/PlazaMeter";

export interface PlazaHomeScreenProps {
  companion: CompanionState;
  connection: "connected" | "disconnected";
  guardPhase: "idle" | "watching" | "interruption" | "permission-lost";
  onStartFocus: () => void;
  recentSessions: CourseGuardSessionRecord[];
}

function moodMessage(mood: CompanionMood): string {
  switch (mood) {
    case "focusing":
      return "Momo is keeping the course close.";
    case "encouraging":
      return "Momo is waiting by the course door.";
    case "proud":
      return "A good piece of learning for the plaza today.";
    case "resting":
      return "Open the Course Guard station to reconnect Momo.";
    case "ready":
      return "Choose a course and give today a small direction.";
  }
}

function guardStatus(
  connection: PlazaHomeScreenProps["connection"],
  phase: PlazaHomeScreenProps["guardPhase"],
): string {
  if (connection === "disconnected") return "Disconnected";
  if (phase === "watching") return "Guarding";
  if (phase === "interruption") return "Return to course";
  if (phase === "permission-lost") return "Permission needed";
  return "Ready";
}

export function PlazaHomeScreen({
  companion,
  connection,
  guardPhase,
  onStartFocus,
  recentSessions,
}: PlazaHomeScreenProps) {
  const unlock = nextUnlock({
    growthPoints: companion.growthPoints,
    unlockedCosmeticIds: companion.unlockedCosmeticIds,
  });
  const growthProgress = unlock
    ? Math.min(
        100,
        ((companion.growthPoints -
          (unlock.requiredGrowthPoints > 0 ? 0 : unlock.requiredGrowthPoints)) /
          unlock.requiredGrowthPoints) *
          100,
      )
    : 100;

  return (
    <main className="plaza-shell" aria-labelledby="plaza-title">
      <header className="plaza-header">
        <div>
          <p className="plaza-eyebrow">Learning Plaza</p>
          <h1 id="plaza-title">Learning Plaza</h1>
          <p className="plaza-header-copy">A little town for focused learning.</p>
        </div>
        <a className="plaza-header-link" href="#/town-hall">
          Town Hall
        </a>
      </header>

      <section className="plaza-hero" aria-label="Focus Friend plaza scene">
        <div className="plaza-scene">
          <span aria-hidden="true" className="plaza-cloud plaza-cloud-one" />
          <span aria-hidden="true" className="plaza-cloud plaza-cloud-two" />
          <div className="plaza-scene-sign">Momo&apos;s plaza</div>
          <FocusFriend
            equippedCosmeticIds={companion.equippedCosmeticIds}
            mood={companion.mood}
            name={companion.name}
          />
          <p className="plaza-companion-message">{moodMessage(companion.mood)}</p>
        </div>
        <div className="plaza-status-panel">
          <div className="plaza-status-heading">
            <div>
              <p className="section-kicker">Companion status</p>
              <h2>{companion.name}</h2>
            </div>
            <span className={`plaza-status-pill plaza-status-${guardPhase}`}>
              {guardStatus(connection, guardPhase)}
            </span>
          </div>
          <div className="plaza-level-row">
            <span>Level {companion.level}</span>
            <span>{companion.growthPoints} growth</span>
          </div>
          <PlazaMeter label="Energy" tone="energy" value={companion.energy} />
          <PlazaMeter
            label={unlock ? `Next: ${unlock.label}` : "Plaza complete"}
            tone="growth"
            value={growthProgress}
            valueLabel={
              unlock ? `${companion.growthPoints} / ${unlock.requiredGrowthPoints}` : "All found"
            }
          />
          <button className="plaza-primary-button" type="button" onClick={onStartFocus}>
            Start a focus session
          </button>
        </div>
      </section>

      <section className="plaza-destinations" aria-labelledby="destinations-title">
        <div className="plaza-section-heading">
          <div>
            <p className="section-kicker">Explore the town</p>
            <h2 id="destinations-title">Where would you like to go?</h2>
          </div>
          <span className="plaza-section-note">{guardStatus(connection, guardPhase)}</span>
        </div>
        <div className="plaza-destination-grid">
          <PlazaDestinationCard
            description="Choose a course and keep it close."
            label="Course Guard"
            route={"course-guard" satisfies AppRoute}
            status={guardStatus(connection, guardPhase)}
          />
          <PlazaDestinationCard
            description="See sessions, returns, and rewards."
            label="Session Archive"
            route={"archive" satisfies AppRoute}
            status={`${recentSessions.length} records`}
          />
          <PlazaDestinationCard
            description="Dress Momo and decorate the plaza."
            label="Wardrobe & Plaza"
            route={"wardrobe" satisfies AppRoute}
            status={`${companion.unlockedCosmeticIds.length} unlocked`}
          />
          <PlazaDestinationCard
            description="Permissions, privacy, and local data."
            label="Town Hall"
            route={"town-hall" satisfies AppRoute}
          />
        </div>
      </section>

      <section className="plaza-recent-card" aria-labelledby="recent-title">
        <div className="plaza-section-heading">
          <div>
            <p className="section-kicker">Today in the plaza</p>
            <h2 id="recent-title">Recent learning</h2>
          </div>
          <a href="#/archive">Open archive</a>
        </div>
        {recentSessions.length === 0 ? (
          <p className="plaza-empty-copy">Your first completed course session will appear here.</p>
        ) : (
          <ul className="plaza-recent-list">
            {recentSessions
              .slice(-3)
              .reverse()
              .map((session) => (
                <li key={session.id}>
                  <span>{session.courseLabel}</span>
                  <strong>{session.growthPoints} growth</strong>
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  );
}
