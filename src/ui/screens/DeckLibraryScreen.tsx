import type { ReactNode } from "react";

type DeckLibraryScreenProps = { children: ReactNode };

export function DeckLibraryScreen({ children }: DeckLibraryScreenProps) {
  return (
    <section className="deck-workspace" aria-labelledby="deck-library-title">
      <div className="deck-heading">
        <div>
          <p className="section-kicker">Optional local support</p>
          <h2 id="deck-library-title">Deck Library</h2>
        </div>
        <p>Keep prompts and explanations on this device for an optional Quick Review.</p>
      </div>
      {children}
    </section>
  );
}
