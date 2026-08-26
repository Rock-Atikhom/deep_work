import type { CareAction } from "../../plaza/plaza-machine";
import { nextUnlock } from "../../plaza/plaza-rewards";
import type {
  CompanionMood,
  CompanionState,
  CourseGuardSessionRecord,
} from "../../plaza/plaza-types";
import { CareActionBar } from "../components/CareActionBar";
import { FocusFriend } from "../components/FocusFriend";
import { PlazaGameHud } from "../components/PlazaGameHud";
import { PlazaMap } from "../components/PlazaMap";
import { PlazaMeter } from "../components/PlazaMeter";
import { TodayQuest } from "../components/TodayQuest";
import { LegalFooter } from "./LegalScreen";

export interface PlazaHomeScreenProps {
  companion: CompanionState;
  connection: "connected" | "disconnected";
  guardPhase: "idle" | "watching" | "interruption" | "permission-lost";
  onCare: (action: CareAction) => void;
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
  onCare,
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
  const status = guardStatus(connection, guardPhase);
  const statusClass = connection === "disconnected" ? "disconnected" : guardPhase;
  const rewardCount = recentSessions.filter((session) => session.rewardId !== null).length;

  return (
    <main className="plaza-shell" aria-labelledby="plaza-title">
      <PlazaGameHud companion={companion} guardStatus={status} rewardCount={rewardCount} />

      <header className="plaza-header">
        <div>
          <p className="plaza-eyebrow">A tiny town for focused learning</p>
          <h1 id="plaza-title">Momo&apos;s Plaza</h1>
          <p className="plaza-header-copy">Care for Momo, then learn together.</p>
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
            colorStyle={companion.colorStyle}
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
            <span className={`plaza-status-pill plaza-status-${statusClass}`}>{status}</span>
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
          <p className="plaza-next-unlock">
            {unlock ? `Next unlock: ${unlock.label}` : "Every Plaza reward is unlocked."}
          </p>
        </div>
      </section>

      <CareActionBar onCare={onCare} onStudy={onStartFocus} />

      <TodayQuest growthPoints={companion.growthPoints} unlock={unlock} />

      <section className="plaza-destinations" aria-labelledby="destinations-title">
        <div className="plaza-section-heading">
          <div>
            <p className="section-kicker">Explore the town</p>
            <h2 id="destinations-title">Where would you like to go?</h2>
          </div>
          <span className="plaza-section-note">{status}</span>
        </div>
        <PlazaMap />
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
      <LegalFooter />
    </main>
  );
}
