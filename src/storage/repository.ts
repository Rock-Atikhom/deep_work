import type {
  FinishReason,
  Reflection,
  SessionState,
  SoundPreference,
} from "../session/session-machine";

export const STORAGE_SCHEMA_VERSION = 1 as const;
const DEFAULT_DATABASE_NAME = "deep-work-companion";
const STORE_NAME = "app-state";
const ROOT_KEY = "root";

export interface SessionPreferences {
  durationMs: number;
  sound: SoundPreference;
}

export interface StoredSession extends SessionState {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  sessionId: string;
}

export interface SessionSummary {
  awarenessCount: number;
  durationMs: number;
  elapsedMs: number;
  finishedAtMs: number;
  finishReason: Exclude<FinishReason, null>;
  goal: string;
  reflection?: Reflection;
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  sessionId: string;
  startedAtMs: number;
  subject: string;
}

export interface RepositorySnapshot {
  active: StoredSession | null;
  preferences: SessionPreferences;
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  summaries: SessionSummary[];
}

export interface DeepWorkRepository {
  close(): void;
  completeSession(session: SessionState): Promise<void>;
  load(): Promise<RepositorySnapshot>;
  saveActiveSession(session: SessionState): Promise<void>;
  savePreferences(preferences: SessionPreferences): Promise<void>;
}

interface StoredRoot extends RepositorySnapshot {
  key: typeof ROOT_KEY;
}

const defaultPreferences: SessionPreferences = {
  durationMs: 25 * 60_000,
  sound: "silent",
};

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function emptyRoot(): StoredRoot {
  return {
    active: null,
    key: ROOT_KEY,
    preferences: { ...defaultPreferences },
    schemaVersion: STORAGE_SCHEMA_VERSION,
    summaries: [],
  };
}

function toStoredSession(session: SessionState): StoredSession {
  if (
    (session.phase !== "focus" && session.phase !== "paused" && session.phase !== "reflection") ||
    session.sessionStartedAtMs === null
  ) {
    throw new Error("Only an active session can be persisted");
  }

  return {
    ...session,
    schemaVersion: STORAGE_SCHEMA_VERSION,
    sessionId: session.sessionId ?? `session-${session.sessionStartedAtMs}`,
  };
}

function toSummary(session: SessionState): SessionSummary {
  if (
    session.phase !== "complete" ||
    session.finishReason === null ||
    session.sessionId === null ||
    session.sessionStartedAtMs === null
  ) {
    throw new Error("Only a reflected session can be summarized");
  }

  const summary: SessionSummary = {
    awarenessCount: 0,
    durationMs: session.config.durationMs,
    elapsedMs: session.elapsedMs,
    finishedAtMs: session.finishedAtMs ?? session.sessionStartedAtMs + session.elapsedMs,
    finishReason: session.finishReason,
    goal: session.config.goal,
    schemaVersion: STORAGE_SCHEMA_VERSION,
    sessionId: session.sessionId,
    startedAtMs: session.sessionStartedAtMs,
    subject: session.config.subject,
  };

  if (session.reflection !== null) {
    summary.reflection = session.reflection;
  }

  return summary;
}

async function openDatabase(databaseName: string, factory: IDBFactory): Promise<IDBDatabase> {
  const request = factory.open(databaseName, STORAGE_SCHEMA_VERSION);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
    }
  };
  return requestResult(request);
}

export async function openDeepWorkRepository(
  options: {
    databaseName?: string;
    indexedDBFactory?: IDBFactory;
  } = {},
): Promise<DeepWorkRepository> {
  const factory = options.indexedDBFactory ?? globalThis.indexedDB;
  if (!factory) {
    throw new Error("IndexedDB is unavailable in this browser");
  }

  const database = await openDatabase(options.databaseName ?? DEFAULT_DATABASE_NAME, factory);

  async function readRoot(): Promise<StoredRoot> {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const record = await requestResult(transaction.objectStore(STORE_NAME).get(ROOT_KEY));
    await transactionDone(transaction);
    return record ? { ...emptyRoot(), ...record } : emptyRoot();
  }

  async function writeRoot(root: StoredRoot): Promise<void> {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(root);
    await transactionDone(transaction);
  }

  return {
    close() {
      database.close();
    },

    async completeSession(session) {
      const summary = toSummary(session);
      const root = await readRoot();
      const existingIndex = root.summaries.findIndex(
        (candidate) => candidate.sessionId === summary.sessionId,
      );
      if (existingIndex >= 0) {
        root.summaries[existingIndex] = summary;
      } else {
        root.summaries.push(summary);
      }
      root.active = null;
      await writeRoot(root);
    },

    load: readRoot,

    async saveActiveSession(session) {
      const root = await readRoot();
      root.active = toStoredSession(session);
      await writeRoot(root);
    },

    async savePreferences(preferences) {
      const root = await readRoot();
      root.preferences = { ...preferences };
      await writeRoot(root);
    },
  };
}
