export type AppRoute =
  | "welcome"
  | "setup"
  | "calibration"
  | "focus"
  | "quick-review"
  | "reflection"
  | "history"
  | "decks"
  | "settings";

const ROUTES: readonly AppRoute[] = [
  "welcome",
  "setup",
  "calibration",
  "focus",
  "quick-review",
  "reflection",
  "history",
  "decks",
  "settings",
];

export function parseHashRoute(hash: string): AppRoute {
  const route = hash.replace(/^#\/?/, "").split("/")[0];
  return ROUTES.includes(route as AppRoute) ? (route as AppRoute) : "welcome";
}

export function formatHashRoute(route: AppRoute): string {
  return `#/${route}`;
}
