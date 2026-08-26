import type { CosmeticDefinition } from "../../plaza/plaza-rewards";
import type { CompanionState } from "../../plaza/plaza-types";
import { FocusFriend } from "../components/FocusFriend";
import { PlazaGameHud } from "../components/PlazaGameHud";

export interface SessionRewardScreenProps {
  companion: CompanionState;
  earnedGrowth: number;
  goal: string;
  nextUnlock: CosmeticDefinition | null;
  onReturnToPlaza: () => void;
  reflection: string;
  rewardCount: number;
  savedLocally: boolean;
  subject: string;
}

export function SessionRewardScreen({
  companion,
  earnedGrowth,
  goal,
  nextUnlock,
  onReturnToPlaza,
  reflection,
  rewardCount,
  savedLocally,
  subject,
}: SessionRewardScreenProps) {
  return (
    <main className="session-reward-shell" aria-labelledby="session-reward-title">
      <PlazaGameHud companion={companion} guardStatus="Reward time" rewardCount={rewardCount} />
      <section className="session-reward-card">
        <FocusFriend
          colorStyle={companion.colorStyle}
          equippedCosmeticIds={companion.equippedCosmeticIds}
          mood="proud"
          name={companion.name}
        />
        <p className="plaza-eyebrow">Focus reward</p>
        <h1 id="session-reward-title">Momo is proud of you!</h1>
        <p className="session-reward-summary">
          {subject} · {goal}
        </p>
        <p className="session-reward-reflection">Reflection: {reflection}</p>
        <section className="session-reward-growth" aria-label="Session reward">
          <strong>+{earnedGrowth} growth</strong>
        </section>
        <p className="session-reward-unlock">
          {nextUnlock ? `Next unlock: ${nextUnlock.label}` : "Every Plaza reward is unlocked."}
        </p>
        <p className="session-reward-saving">
          {savedLocally
            ? "Your session and Momo's progress are saved on this device."
            : "Your session and Momo's progress are available for this visit only."}
        </p>
        <button className="plaza-primary-button" type="button" onClick={onReturnToPlaza}>
          Back to Momo&apos;s Plaza
        </button>
      </section>
    </main>
  );
}
