import type { RepositorySnapshot } from "./repository";

export function formatLocalExport(snapshot: RepositorySnapshot): string {
  return JSON.stringify(
    {
      title: "Deep Work Companion local data and Learning Garden",
      schemaVersion: snapshot.schemaVersion,
      currentSession: snapshot.active,
      summaries: snapshot.summaries,
      garden: snapshot.garden,
      preferences: snapshot.preferences,
    },
    null,
    2,
  );
}
