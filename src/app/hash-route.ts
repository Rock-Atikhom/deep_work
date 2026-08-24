export type AppRoute =
  | "welcome"
  | "plaza"
  | "course-guard"
  | "archive"
  | "wardrobe"
  | "town-hall"
  | "setup"
  | "calibration"
  | "focus"
  | "quick-review"
  | "reflection"
  | "history"
  | "decks"
  | "settings"
  | "privacy"
  | "terms";

const ROUTES: readonly AppRoute[] = [
  "welcome",
  "plaza",
  "course-guard",
  "archive",
  "wardrobe",
  "town-hall",
  "setup",
  "calibration",
  "focus",
  "quick-review",
  "reflection",
  "history",
  "decks",
  "settings",
  "privacy",
  "terms",
];

export function parseHashRoute(hash: string): AppRoute {
  const route = hash.replace(/^#\/?/, "").split("/")[0];
  return ROUTES.includes(route as AppRoute) ? (route as AppRoute) : "welcome";
}

export function formatHashRoute(route: AppRoute): string {
  return `#/${route}`;
}
