import type { RepositorySnapshot } from "./repository";

export function formatLocalExport(snapshot: RepositorySnapshot): string {
  return JSON.stringify(
    {
      title: "Deep Work Companion local data and Learning Garden",
      schemaVersion: snapshot.schemaVersion,
      currentSession: snapshot.active,
      decks: snapshot.decks,
      garden: snapshot.garden,
      plaza: snapshot.plaza,
      preferences: snapshot.preferences,
      summaries: snapshot.summaries,
    },
    null,
    2,
  );
}
