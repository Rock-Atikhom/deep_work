import type {
  FinishReason,
  Reflection,
  SessionState,
  SoundPreference,
} from "../session/session-machine";
import type { PresetName } from "../session/session-types";
import {
  cloneQuestionDeck,
  parseQuestionDeckDocument,
  sampleQuestionDeck,
  validateQuestionDeck,
  type QuestionDeck,
} from "../decks/question-deck";
import { deriveGarden, type GardenState } from "../garden/garden";
import { createInitialPlazaState } from "../plaza/plaza-machine";
import {
  PLAZA_SCHEMA_VERSION,
  type CompanionState,
  type CourseGuardSessionRecord,
  type PlazaState,
} from "../plaza/plaza-types";
import { PLAZA_COSMETICS } from "../plaza/plaza-rewards";
import { formatLocalExport } from "./export";

export const STORAGE_SCHEMA_VERSION = 1 as const;
const DEFAULT_DATABASE_NAME = "deep-work-companion";
const STORE_NAME = "app-state";
const ROOT_KEY = "root";

export interface SessionPreferences {
  durationMs: number;
  preset?: PresetName;
  reducedMotion?: boolean;
  selectedDeckId: string | null;
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
  quickReviewCompleted?: boolean;
  reflection?: Reflection;
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  sessionId: string;
  startedAtMs: number;
  subject: string;
}

export interface RepositorySnapshot {
  active: StoredSession | null;
  decks: QuestionDeck[];
  garden: GardenState;
  plaza: PlazaState;
  preferences: SessionPreferences;
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  summaries: SessionSummary[];
}

export interface DeepWorkRepository {
  close(): void;
  completeSession(session: SessionState): Promise<RepositorySnapshot>;
  deleteAllData(): Promise<RepositorySnapshot>;
  deleteDeck(deckId: string): Promise<RepositorySnapshot>;
  exportData(): Promise<string>;
  importDeck(content: string): Promise<RepositorySnapshot>;
  load(): Promise<RepositorySnapshot>;
  savePlaza(plaza: PlazaState): Promise<RepositorySnapshot>;
  saveDeck(deck: QuestionDeck): Promise<RepositorySnapshot>;
  saveActiveSession(session: SessionState): Promise<void>;
  savePreferences(preferences: SessionPreferences): Promise<void>;
}

interface StoredRoot extends RepositorySnapshot {
  key: typeof ROOT_KEY;
}

const defaultPreferences: SessionPreferences = {
  durationMs: 25 * 60_000,
  selectedDeckId: null,
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
    decks: [],
    garden: { plants: [], schemaVersion: 1 },
    plaza: createInitialPlazaState(),
    key: ROOT_KEY,
    preferences: { ...defaultPreferences },
    schemaVersion: STORAGE_SCHEMA_VERSION,
    summaries: [],
  };
}

function finiteNonNegative(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeCompanion(value: unknown): CompanionState {
  const initial = createInitialPlazaState().companion;
  const candidate = value && typeof value === "object" ? (value as Partial<CompanionState>) : {};
  const cosmeticIds = new Set(PLAZA_COSMETICS.map((cosmetic) => cosmetic.id));
  const normalizeIds = (ids: unknown): string[] =>
    Array.isArray(ids)
      ? [
          ...new Set(
            ids.filter((id): id is string => typeof id === "string" && cosmeticIds.has(id)),
          ),
        ]
      : [];
  const growthPoints = finiteNonNegative(candidate.growthPoints, initial.growthPoints);
  const energy = Math.min(100, finiteNonNegative(candidate.energy, initial.energy));
  const level = Math.max(1, Math.floor(finiteNonNegative(candidate.level, initial.level)));
  const mood =
    candidate.mood === "resting" ||
    candidate.mood === "ready" ||
    candidate.mood === "focusing" ||
    candidate.mood === "proud" ||
    candidate.mood === "encouraging"
      ? candidate.mood
      : initial.mood;
  return {
    name:
      typeof candidate.name === "string" && candidate.name.trim()
        ? candidate.name.trim()
        : initial.name,
    mood,
    energy,
    growthPoints,
    level,
    equippedCosmeticIds: normalizeIds(candidate.equippedCosmeticIds),
    unlockedCosmeticIds: normalizeIds(candidate.unlockedCosmeticIds),
    unlockedPlazaItemIds: Array.isArray(candidate.unlockedPlazaItemIds)
      ? [
          ...new Set(
            candidate.unlockedPlazaItemIds.filter((id): id is string => typeof id === "string"),
          ),
        ]
      : [],
  };
}

function normalizePlazaState(value: unknown): PlazaState {
  const candidate = value && typeof value === "object" ? (value as Partial<PlazaState>) : {};
  const sessions = Array.isArray(candidate.courseGuardSessions)
    ? candidate.courseGuardSessions.filter(
        (record): record is CourseGuardSessionRecord =>
          !!record &&
          typeof record === "object" &&
          typeof record.id === "string" &&
          typeof record.courseOrigin === "string" &&
          typeof record.courseLabel === "string" &&
          typeof record.startedAtMs === "number" &&
          typeof record.finishedAtMs === "number" &&
          typeof record.elapsedMs === "number" &&
          typeof record.returnCount === "number" &&
          (record.completionStatus === "completed" || record.completionStatus === "incomplete") &&
          typeof record.growthPoints === "number" &&
          (record.rewardId === null || typeof record.rewardId === "string"),
      )
    : [];
  return {
    schemaVersion: PLAZA_SCHEMA_VERSION,
    companion: normalizeCompanion(candidate.companion),
    courseGuardSessions: sessions.map((record) => ({
      ...record,
      elapsedMs: finiteNonNegative(record.elapsedMs, 0),
      finishedAtMs: finiteNonNegative(record.finishedAtMs, record.startedAtMs),
      growthPoints: finiteNonNegative(record.growthPoints, 0),
      returnCount: Math.floor(finiteNonNegative(record.returnCount, 0)),
      startedAtMs: finiteNonNegative(record.startedAtMs, 0),
    })),
  };
}

function initialRoot(): StoredRoot {
  return {
    ...emptyRoot(),
    decks: [sampleQuestionDeck()],
  };
}

function toStoredSession(session: SessionState): StoredSession {
  if (
    (session.phase !== "focus" &&
      session.phase !== "paused" &&
      session.phase !== "notes-pause" &&
      session.phase !== "gentle-reset" &&
      session.phase !== "reflection") ||
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
    awarenessCount: session.awarenessCount,
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

  if (session.quickReviewCompleted) {
    summary.quickReviewCompleted = true;
  }

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
    const root = record
      ? {
          ...emptyRoot(),
          ...record,
          active: record.active
            ? {
                ...record.active,
                awarenessCount:
                  typeof record.active.awarenessCount === "number"
                    ? record.active.awarenessCount
                    : 0,
                awarenessMode: record.active.awarenessMode ?? "active",
                quickReviewCompleted: record.active.quickReviewCompleted === true,
              }
            : null,
          decks: Array.isArray(record.decks)
            ? record.decks.map((deck: unknown) => validateQuestionDeck(deck))
            : [sampleQuestionDeck()],
          plaza: normalizePlazaState(record.plaza),
          preferences: { ...defaultPreferences, ...record.preferences },
          summaries: Array.isArray(record.summaries)
            ? record.summaries.map((summary: SessionSummary) => ({
                ...summary,
                awarenessCount:
                  typeof summary.awarenessCount === "number" ? summary.awarenessCount : 0,
              }))
            : [],
        }
      : initialRoot();
    return { ...root, garden: deriveGarden(root.summaries) };
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
      root.garden = deriveGarden(root.summaries);
      root.active = null;
      await writeRoot(root);
      return root;
    },

    async deleteAllData() {
      const root = emptyRoot();
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).clear();
      transaction.objectStore(STORE_NAME).put(root);
      await transactionDone(transaction);
      return root;
    },

    async deleteDeck(deckId) {
      const root = await readRoot();
      root.decks = root.decks.filter((deck) => deck.id !== deckId);
      if (root.preferences.selectedDeckId === deckId) {
        root.preferences.selectedDeckId = null;
      }
      await writeRoot(root);
      return root;
    },

    async exportData() {
      return formatLocalExport(await readRoot());
    },

    async importDeck(content) {
      const deck = parseQuestionDeckDocument(content);
      const root = await readRoot();
      if (root.decks.some((candidate) => candidate.id === deck.id)) {
        throw new Error(`A Question Deck with id "${deck.id}" already exists.`);
      }
      root.decks = [...root.decks, deck];
      await writeRoot(root);
      return root;
    },

    load: readRoot,

    async savePlaza(plaza) {
      const root = await readRoot();
      root.plaza = normalizePlazaState(plaza);
      await writeRoot(root);
      return root;
    },

    async saveDeck(deck) {
      const validatedDeck = validateQuestionDeck(deck);
      const root = await readRoot();
      const existingIndex = root.decks.findIndex((candidate) => candidate.id === validatedDeck.id);
      if (existingIndex >= 0) {
        root.decks[existingIndex] = cloneQuestionDeck(validatedDeck);
      } else {
        root.decks.push(cloneQuestionDeck(validatedDeck));
      }
      await writeRoot(root);
      return root;
    },

    async saveActiveSession(session) {
      const root = await readRoot();
      root.active = toStoredSession(session);
      await writeRoot(root);
    },

    async savePreferences(preferences) {
      const root = await readRoot();
      root.preferences = { ...defaultPreferences, ...preferences };
      await writeRoot(root);
    },
  };
}
