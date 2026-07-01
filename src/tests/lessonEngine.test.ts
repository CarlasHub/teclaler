import { describe, expect, it } from "vitest";
import { casaItem, ptPTStarterPack } from "../curriculum/ptPTPack";
import {
  createLessonState,
  getLessonReplayTarget,
  processLessonBackspace,
  processLessonInput,
} from "../engine/lessonEngine";
import type { LessonEvent } from "../engine/events";

describe("lesson engine", () => {
  it("completes casa and emits semantic learning events", () => {
    let state = createLessonState(casaItem);
    const emittedEvents: LessonEvent[] = [];

    for (const key of ["c", "a", "s", "a"]) {
      const update = processLessonInput(casaItem, state, key);
      state = update.state;
      emittedEvents.push(...update.events);
    }

    expect(state.completed).toBe(true);
    expect(state.typed).toEqual(["c", "a", "s", "a"]);
    expect(
      emittedEvents.filter((event) => event.type === "KEY_ACCEPTED"),
    ).toHaveLength(4);
    expect(
      emittedEvents.filter((event) => event.type === "SYLLABLE_COMPLETED"),
    ).toEqual([
      {
        type: "SYLLABLE_COMPLETED",
        syllable: "ca",
        audioId: "pt-PT.syllable.ca",
      },
      {
        type: "SYLLABLE_COMPLETED",
        syllable: "sa",
        audioId: "pt-PT.syllable.sa",
      },
    ]);
    expect(emittedEvents.at(-1)).toEqual({
      type: "WORD_COMPLETED",
      itemId: "word-casa-pt-pt",
      audioId: "pt-PT.word.casa",
    });
  });

  it("does not advance on a wrong key", () => {
    const state = createLessonState(casaItem);
    const update = processLessonInput(casaItem, state, "m");

    expect(update.state.cursorIndex).toBe(0);
    expect(update.state.typed).toEqual([null, null, null, null]);
    expect(update.events).toEqual([
      { type: "KEY_REJECTED", expected: "c", actual: "m" },
    ]);
  });

  it("rolls back typed state and syllable completion on backspace", () => {
    const malaItem = ptPTStarterPack.items.find(
      (item) => item.id === "word-mala-pt-pt",
    );
    if (!malaItem) {
      throw new Error("Missing MALA starter item");
    }

    let state = createLessonState(malaItem);
    for (const key of ["m", "a", "l", "a"]) {
      state = processLessonInput(malaItem, state, key).state;
    }

    expect(state.completed).toBe(true);
    expect(state.completedSyllableIndexes).toEqual([0, 1]);

    const deleted = processLessonBackspace(malaItem, state);

    expect(deleted.state.completed).toBe(false);
    expect(deleted.state.cursorIndex).toBe(3);
    expect(deleted.state.typed).toEqual(["m", "a", "l", null]);
    expect(deleted.state.completedSyllableIndexes).toEqual([0]);

    const retyped = processLessonInput(malaItem, deleted.state, "a");

    expect(retyped.state.completed).toBe(true);
    expect(retyped.events.at(-1)).toEqual({
      type: "WORD_COMPLETED",
      itemId: "word-mala-pt-pt",
      audioId: "pt-PT.word.mala",
    });
  });

  it("resolves replay audio targets from typed lesson progress", () => {
    let state = createLessonState(casaItem);

    expect(getLessonReplayTarget(casaItem, state)).toEqual({
      disabled: true,
      displayText: "",
      text: "",
    });

    state = processLessonInput(casaItem, state, "c").state;
    expect(getLessonReplayTarget(casaItem, state)).toEqual({
      audioId: "pt-PT.letter.c",
      disabled: false,
      displayText: "C",
      kind: "letter",
      text: "c",
    });

    state = processLessonInput(casaItem, state, "a").state;
    expect(getLessonReplayTarget(casaItem, state)).toEqual({
      audioId: "pt-PT.syllable.ca",
      disabled: false,
      displayText: "CA",
      kind: "syllable",
      text: "ca",
    });

    state = processLessonInput(casaItem, state, "s").state;
    expect(getLessonReplayTarget(casaItem, state)).toEqual({
      disabled: false,
      displayText: "CAS",
      kind: "partial",
      text: "cas",
    });

    state = processLessonInput(casaItem, state, "a").state;
    expect(getLessonReplayTarget(casaItem, state)).toEqual({
      audioId: "pt-PT.word.casa",
      disabled: false,
      displayText: "CASA",
      kind: "word",
      text: "casa",
    });

    state = processLessonBackspace(casaItem, state).state;
    expect(getLessonReplayTarget(casaItem, state)).toEqual({
      disabled: false,
      displayText: "CAS",
      kind: "partial",
      text: "cas",
    });
  });
});
