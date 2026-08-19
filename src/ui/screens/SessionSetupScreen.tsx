import type { FormEvent, ReactNode } from "react";

type SessionSetupScreenProps = {
  children?: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export function SessionSetupScreen({ children, onSubmit }: SessionSetupScreenProps) {
  return (
    <section className="session-setup-screen" aria-labelledby="session-setup-title">
      <p className="section-kicker">Study block</p>
      <h2 id="session-setup-title">Set your intention</h2>
      <form onSubmit={onSubmit}>{children}</form>
    </section>
  );
}
