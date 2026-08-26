import type { CompanionColorStyle, CompanionMood } from "../../plaza/plaza-types";

const moodLabels: Record<CompanionMood, string> = {
  resting: "resting",
  ready: "ready",
  focusing: "focusing",
  proud: "proud",
  encouraging: "encouraging you",
};

export interface FocusFriendProps {
  colorStyle?: CompanionColorStyle;
  equippedCosmeticIds?: string[];
  mood: CompanionMood;
  name: string;
}

export function FocusFriend({
  colorStyle,
  equippedCosmeticIds = [],
  mood,
  name,
}: FocusFriendProps) {
  return (
    <div
      aria-label={`${name}, ${moodLabels[mood]}`}
      className={
        colorStyle
          ? `focus-friend focus-friend-color-${colorStyle} focus-friend-${mood}`
          : `focus-friend focus-friend-${mood}`
      }
      role="img"
    >
      <span aria-hidden="true" className="focus-friend-shadow" />
      <span aria-hidden="true" className="focus-friend-body">
        <span className="focus-friend-ear focus-friend-ear-left" />
        <span className="focus-friend-ear focus-friend-ear-right" />
        <span className="focus-friend-face">
          <span className="focus-friend-eye focus-friend-eye-left" />
          <span className="focus-friend-eye focus-friend-eye-right" />
          <span className="focus-friend-mouth" />
        </span>
        {equippedCosmeticIds.includes("sticker-sun") && (
          <span className="focus-friend-sticker" title="Sun sticker" />
        )}
        {equippedCosmeticIds.includes("hat-leaf") && (
          <span className="focus-friend-hat" title="Leaf cap" />
        )}
      </span>
      <span aria-hidden="true" className="focus-friend-mood-dot" />
    </div>
  );
}
