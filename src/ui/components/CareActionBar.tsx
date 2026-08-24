import type { CareAction } from "../../plaza/plaza-machine";

export interface CareActionBarProps {
  onCare: (action: CareAction) => void;
  onStudy: () => void;
}

export function CareActionBar({ onCare, onStudy }: CareActionBarProps) {
  return (
    <section aria-label="Care for Momo" className="momo-care-bar">
      <button type="button" onClick={() => onCare("feed")}>
        Feed Momo
      </button>
      <button type="button" onClick={() => onCare("play")}>
        Play with Momo
      </button>
      <button type="button" onClick={() => onCare("rest")}>
        Let Momo rest
      </button>
      <button type="button" onClick={onStudy}>
        Study with Momo
      </button>
    </section>
  );
}
