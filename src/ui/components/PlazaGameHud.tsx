import type { CompanionState } from "../../plaza/plaza-types";

export interface PlazaGameHudProps {
  companion: CompanionState;
  guardStatus: string;
  rewardCount: number;
}

export function PlazaGameHud({ companion, guardStatus, rewardCount }: PlazaGameHudProps) {
  return (
    <header className="momo-game-hud">
      <strong>{companion.name}&apos;s Plaza</strong>
      <span>Level {companion.level}</span>
      <span>{companion.energy}% energy</span>
      <span>{companion.growthPoints} growth</span>
      <span>{rewardCount} rewards</span>
      <span>{guardStatus}</span>
    </header>
  );
}
