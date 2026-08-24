import type { AppRoute } from "../../app/hash-route";

export interface PlazaDestinationCardProps {
  description: string;
  label: string;
  route: AppRoute;
  status?: string;
}

export function PlazaDestinationCard({
  description,
  label,
  route,
  status,
}: PlazaDestinationCardProps) {
  return (
    <a className="plaza-destination-card" href={`#/${route}`}>
      <span className="plaza-destination-icon" aria-hidden="true">
        ✦
      </span>
      <span className="plaza-destination-copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
      {status && <span className="plaza-destination-status">{status}</span>}
    </a>
  );
}
