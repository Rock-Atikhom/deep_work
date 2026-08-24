import type { AppRoute } from "../../app/hash-route";

interface PlazaMapDestination {
  label: string;
  route: AppRoute;
}

const destinations: readonly PlazaMapDestination[] = [
  { label: "Course Guard", route: "course-guard" },
  { label: "Reward Chest", route: "wardrobe" },
  { label: "Session Archive", route: "archive" },
  { label: "Town Hall", route: "town-hall" },
];

export function PlazaMap() {
  return (
    <nav aria-label="Momo's Plaza map" className="momo-plaza-map">
      {destinations.map((destination) => (
        <a href={`#/${destination.route}`} key={destination.route}>
          {destination.label}
        </a>
      ))}
    </nav>
  );
}
