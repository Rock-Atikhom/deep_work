import { PLAZA_COSMETICS } from "../../plaza/plaza-rewards";
import type { CompanionState } from "../../plaza/plaza-types";
import { FocusFriend } from "../components/FocusFriend";

export interface WardrobeScreenProps {
  companion: CompanionState;
  onEquip: (cosmeticId: string) => void;
}

export function WardrobeScreen({ companion, onEquip }: WardrobeScreenProps) {
  return (
    <main className="plaza-inner-screen momo-wardrobe" aria-labelledby="wardrobe-title">
      <header className="plaza-inner-header">
        <a href="#/plaza">← Plaza</a>
        <div>
          <p className="plaza-eyebrow">Wardrobe & Plaza</p>
          <h1 id="wardrobe-title">Make the town feel like yours</h1>
        </div>
      </header>
      <section className="wardrobe-layout">
        <div className="wardrobe-preview">
          <FocusFriend
            colorStyle={companion.colorStyle}
            equippedCosmeticIds={companion.equippedCosmeticIds}
            mood="proud"
            name={companion.name}
          />
          <p>{companion.name}&apos;s current look</p>
        </div>
        <div className="wardrobe-catalog" aria-label="Cosmetic catalog">
          {PLAZA_COSMETICS.map((cosmetic) => {
            const unlocked = companion.unlockedCosmeticIds.includes(cosmetic.id);
            const equipped = companion.equippedCosmeticIds.includes(cosmetic.id);
            return (
              <article
                className={`cosmetic-card ${unlocked ? "is-unlocked" : "is-locked"}`}
                key={cosmetic.id}
              >
                <span className="cosmetic-card-icon" aria-hidden="true">
                  ✦
                </span>
                <div>
                  <strong>{cosmetic.label}</strong>
                  <span>
                    {unlocked ? "Ready to wear" : `${cosmetic.requiredGrowthPoints} growth needed`}
                  </span>
                </div>
                <button
                  className="plaza-secondary-button"
                  type="button"
                  disabled={!unlocked}
                  onClick={() => onEquip(cosmetic.id)}
                >
                  {equipped ? "Remove" : unlocked ? "Equip" : "Locked"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
