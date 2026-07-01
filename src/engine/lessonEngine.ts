import type { CurriculumItem } from "../curriculum/types";
import type { LessonEvent } from "./events";
import { normalizePortugueseText } from "./inputEngine";

export interface LessonState {
  itemId: string;
  targetSequence: string[];
  typed: Array<string | null>;
  cursorIndex: number;
  completed: boolean;
  acceptedCount: number;
  rejectedCount: number;
  completedSyllableIndexes: number[];
}

export interface LessonUpdate {
  state: LessonState;
  events: LessonEvent[];
}

export type LessonReplayTarget =
  | {
      disabled: true;
      displayText: "";
      text: "";
    }
  | {
      audioId?: string;
      disabled: false;
      displayText: string;
      kind: "letter" | "partial" | "syllable" | "word";
      text: string;
    };

export function createLessonState(item: CurriculumItem): LessonState {
  return {
    itemId: item.id,
    targetSequence: item.targetSequence.map(normalizePortugueseText),
    typed: item.targetSequence.map(() => null),
    cursorIndex: 0,
    completed: false,
    acceptedCount: 0,
    rejectedCount: 0,
    completedSyllableIndexes: [],
  };
}

export function processLessonInput(
  item: CurriculumItem,
  state: LessonState,
  input: string,
): LessonUpdate {
  if (state.completed) {
    return { state, events: [] };
  }

  const actual = normalizePortugueseText(input);
  const expected = state.targetSequence[state.cursorIndex];

  if (!expected || actual !== expected) {
    return {
      state: {
        ...state,
        rejectedCount: state.rejectedCount + 1,
      },
      events: expected ? [{ type: "KEY_REJECTED", expected, actual }] : [],
    };
  }

  const nextCursorIndex = state.cursorIndex + 1;
  const typed = [...state.typed];
  typed[state.cursorIndex] = expected;

  const events: LessonEvent[] = [
    {
      type: "KEY_ACCEPTED",
      char: expected,
      audioId: item.audio.letters?.[state.cursorIndex],
    },
  ];

  const syllableBoundaries = getSyllableBoundaries(item);
  const completedSyllableIndex = syllableBoundaries.findIndex(
    (boundary) => boundary === nextCursorIndex,
  );
  const completedSyllableIndexes = [...state.completedSyllableIndexes];

  if (
    completedSyllableIndex >= 0 &&
    !completedSyllableIndexes.includes(completedSyllableIndex)
  ) {
    completedSyllableIndexes.push(completedSyllableIndex);
    events.push({
      type: "SYLLABLE_COMPLETED",
      syllable: item.syllables?.[completedSyllableIndex] ?? "",
      audioId: item.audio.syllables?.[completedSyllableIndex],
    });
  }

  const completed = nextCursorIndex === state.targetSequence.length;
  if (completed) {
    events.push({
      type: "WORD_COMPLETED",
      itemId: item.id,
      audioId: item.audio.word,
    });
  }

  return {
    state: {
      ...state,
      typed,
      cursorIndex: nextCursorIndex,
      completed,
      acceptedCount: state.acceptedCount + 1,
      completedSyllableIndexes,
    },
    events,
  };
}

export function processLessonBackspace(
  item: CurriculumItem,
  state: LessonState,
): LessonUpdate {
  if (state.cursorIndex === 0) {
    return { state, events: [] };
  }

  const cursorIndex = state.cursorIndex - 1;
  const typed = [...state.typed];
  typed[cursorIndex] = null;

  return {
    state: {
      ...state,
      typed,
      cursorIndex,
      completed: false,
      completedSyllableIndexes: getCompletedSyllableIndexes(item, cursorIndex),
    },
    events: [],
  };
}

export function getCurrentTarget(state: LessonState): string | null {
  if (state.completed) {
    return null;
  }

  return state.targetSequence[state.cursorIndex] ?? null;
}

export function getLessonReplayTarget(
  item: CurriculumItem,
  state: LessonState,
): LessonReplayTarget {
  const typedText = state.typed
    .slice(0, state.cursorIndex)
    .filter((letter): letter is string => Boolean(letter))
    .join("");

  if (!typedText) {
    return {
      disabled: true,
      displayText: "",
      text: "",
    };
  }

  if (state.completed || state.cursorIndex === state.targetSequence.length) {
    return {
      audioId: item.audio.word,
      disabled: false,
      displayText: item.displayText,
      kind: "word",
      text: item.text,
    };
  }

  const syllableIndex = getSyllableBoundaries(item).findIndex(
    (boundary) => boundary === state.cursorIndex,
  );
  const syllable = item.syllables?.[syllableIndex];

  if (syllableIndex >= 0 && syllable) {
    return {
      audioId: item.audio.syllables?.[syllableIndex],
      disabled: false,
      displayText: syllable.toLocaleUpperCase(item.locale),
      kind: "syllable",
      text: normalizePortugueseText(syllable),
    };
  }

  if (state.cursorIndex === 1) {
    return {
      audioId: item.audio.letters?.[0],
      disabled: false,
      displayText: typedText.toLocaleUpperCase(item.locale),
      kind: "letter",
      text: typedText,
    };
  }

  return {
    disabled: false,
    displayText: typedText.toLocaleUpperCase(item.locale),
    kind: "partial",
    text: typedText,
  };
}

export function getSyllableBoundaries(item: CurriculumItem): number[] {
  if (!item.syllables?.length) {
    return [];
  }

  const boundaries: number[] = [];
  let targetIndex = 0;

  for (const syllable of item.syllables) {
    const normalizedSyllable = normalizePortugueseText(syllable);
    let built = "";

    while (
      targetIndex < item.targetSequence.length &&
      normalizePortugueseText(built) !== normalizedSyllable
    ) {
      built += item.targetSequence[targetIndex];
      targetIndex += 1;
    }

    if (normalizePortugueseText(built) === normalizedSyllable) {
      boundaries.push(targetIndex);
    }
  }

  return boundaries;
}

function getCompletedSyllableIndexes(
  item: CurriculumItem,
  cursorIndex: number,
): number[] {
  return getSyllableBoundaries(item).flatMap((boundary, index) =>
    boundary <= cursorIndex ? [index] : [],
  );
}
