import type { CurriculumItem } from "../curriculum/types";
import type { LessonEvent } from "../engine/events";

const STORAGE_KEY = "teclaler.progress.v1";
const MAX_ATTEMPTS = 100;

export interface AttemptRecord {
  id: string;
  itemId: string;
  expected?: string;
  actual?: string;
  correct: boolean;
  eventType: LessonEvent["type"];
  completedWord?: boolean;
  timestamp: string;
}

export interface ProgressSnapshot {
  attempts: AttemptRecord[];
  completedItems: Record<string, number>;
}

export interface ProgressStore {
  load(): ProgressSnapshot;
  recordLessonEvents(
    item: CurriculumItem,
    events: LessonEvent[],
  ): ProgressSnapshot;
  reset(): ProgressSnapshot;
}

export function createEmptyProgress(): ProgressSnapshot {
  return {
    attempts: [],
    completedItems: {},
  };
}

export function createBrowserProgressStore(
  storage: Storage | null = getLocalStorage(),
): ProgressStore {
  function load(): ProgressSnapshot {
    if (!storage) {
      return createEmptyProgress();
    }

    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyProgress();
    }

    try {
      return JSON.parse(raw) as ProgressSnapshot;
    } catch {
      return createEmptyProgress();
    }
  }

  function save(snapshot: ProgressSnapshot): ProgressSnapshot {
    storage?.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return snapshot;
  }

  function recordLessonEvents(
    item: CurriculumItem,
    events: LessonEvent[],
  ): ProgressSnapshot {
    const snapshot = load();
    const timestamp = new Date().toISOString();
    const attempts = events.flatMap((event): AttemptRecord[] => {
      if (event.type === "KEY_ACCEPTED") {
        return [
          {
            id: createRecordId(),
            itemId: item.id,
            expected: event.char,
            actual: event.char,
            correct: true,
            eventType: event.type,
            timestamp,
          },
        ];
      }

      if (event.type === "KEY_REJECTED") {
        return [
          {
            id: createRecordId(),
            itemId: item.id,
            expected: event.expected,
            actual: event.actual,
            correct: false,
            eventType: event.type,
            timestamp,
          },
        ];
      }

      if (event.type === "WORD_COMPLETED") {
        return [
          {
            id: createRecordId(),
            itemId: item.id,
            correct: true,
            eventType: event.type,
            completedWord: true,
            timestamp,
          },
        ];
      }

      return [];
    });

    const completedItems = { ...snapshot.completedItems };
    if (events.some((event) => event.type === "WORD_COMPLETED")) {
      completedItems[item.id] = (completedItems[item.id] ?? 0) + 1;
    }

    return save({
      attempts: [...snapshot.attempts, ...attempts].slice(-MAX_ATTEMPTS),
      completedItems,
    });
  }

  function reset(): ProgressSnapshot {
    storage?.removeItem(STORAGE_KEY);
    return createEmptyProgress();
  }

  return {
    load,
    recordLessonEvents,
    reset,
  };
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function createRecordId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
