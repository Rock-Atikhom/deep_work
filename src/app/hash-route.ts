export type AppRoute =
  "welcome" | "setup" | "calibration" | "focus" | "quick-review" | "reflection";

const ROUTES: readonly AppRoute[] = [
  "welcome",
  "setup",
  "calibration",
  "focus",
  "quick-review",
  "reflection",
];

export function parseHashRoute(hash: string): AppRoute {
  const route = hash.replace(/^#\/?/, "").split("/")[0];
  return ROUTES.includes(route as AppRoute) ? (route as AppRoute) : "welcome";
}

export function formatHashRoute(route: AppRoute): string {
  return `#/${route}`;
}
