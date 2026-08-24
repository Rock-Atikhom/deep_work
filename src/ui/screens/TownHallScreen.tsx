import type { ReactNode } from "react";

export interface TownHallScreenProps {
  children: ReactNode;
  connection: "connected" | "disconnected";
}

export function TownHallScreen({ children, connection }: TownHallScreenProps) {
  return (
    <main className="plaza-inner-screen" aria-labelledby="town-hall-title">
      <header className="plaza-inner-header">
        <a href="#/plaza">← Plaza</a>
        <div>
          <p className="plaza-eyebrow">Town Hall</p>
          <h1 id="town-hall-title">Keep your study world yours</h1>
        </div>
        <span className={`plaza-status-pill plaza-status-${connection}`}>
          {connection === "connected" ? "Extension connected" : "Extension disconnected"}
        </span>
      </header>
      {children}
    </main>
  );
}
