import { describe, expect, it } from "vitest";
import { ptPTAudioManifest } from "../audio/manifest";
import type { AudioManifest } from "../audio/types";
import { validateAudioManifest } from "../audio/validators";
import { ptPTStarterPack } from "../curriculum/ptPTPack";
import { starterLesson } from "../curriculum/starterLesson";
import type { CurriculumPack } from "../curriculum/types";
import {
  validateCurriculumPack,
  validateStarterLesson,
} from "../curriculum/validators";
import { normalizePhysicalKey } from "../engine/inputEngine";
import { createLessonState, processLessonInput } from "../engine/lessonEngine";

const EXPECTED_STARTER_WORDS = ["casa", "mala", "pato", "sapo", "bola"];

describe("pt-PT starter curriculum", () => {
  it("loads the five content-driven starter words in order", () => {
    expect(starterLesson.portugueseVariant).toBe("pt-PT");
    expect(starterLesson.words.map((word) => word.canonicalText)).toEqual(
      EXPECTED_STARTER_WORDS,
    );
    expect(ptPTStarterPack.locale).toBe("pt-PT");
    expect(ptPTStarterPack.items.map((item) => item.text)).toEqual(
      EXPECTED_STARTER_WORDS,
    );
  });

  it("keeps required structured fields on each starter lesson word", () => {
    for (const [index, word] of starterLesson.words.entries()) {
      expect(word.id).toMatch(/^word-.+-pt-pt$/);
      expect(word.displayText).toBe(
        word.canonicalText.toLocaleUpperCase("pt-PT"),
      );
      expect(word.syllables.join("").toLocaleLowerCase("pt-PT")).toBe(
        word.canonicalText,
      );
      expect(word.expectedKeys.join("").toLocaleLowerCase("pt-PT")).toBe(
        word.canonicalText,
      );
      expect(word.imageAsset).toMatch(/^\/images\/.+\.svg$/);
      expect(word.letterAudioEventIds).toHaveLength(word.expectedKeys.length);
      expect(word.syllableAudioEventIds).toHaveLength(word.syllables.length);
      expect(word.wordAudioEventId).toBe(`pt-PT.word.${word.canonicalText}`);
      expect(word.portugueseVariant).toBe("pt-PT");
      expect(word.difficulty).toBeGreaterThan(0);
      expect(word.order).toBe(index + 1);
    }
  });

  it("has valid curriculum and placeholder audio references", () => {
    expect(validateAudioManifest(ptPTAudioManifest)).toEqual([]);
    expect(validateStarterLesson(starterLesson, ptPTAudioManifest)).toEqual([]);
    expect(validateCurriculumPack(ptPTStarterPack, ptPTAudioManifest)).toEqual(
      [],
    );
  });

  it("fails validation when starter curriculum references missing audio", () => {
    const brokenManifest: AudioManifest = {
      ...ptPTAudioManifest,
      assets: ptPTAudioManifest.assets.filter(
        (asset) => asset.id !== "pt-PT.word.casa",
      ),
    };

    expect(
      validateCurriculumPack(ptPTStarterPack, brokenManifest),
    ).toContainEqual(
      expect.objectContaining({
        code: "curriculum.missing_audio",
        itemId: "word-casa-pt-pt",
      }),
    );
  });

  it("fails validation for malformed structured starter lesson entries", () => {
    const brokenLesson = {
      ...starterLesson,
      words: [
        {
          ...starterLesson.words[0],
          expectedKeys: [],
        },
        {
          ...starterLesson.words[1],
          id: starterLesson.words[0].id,
        },
        {
          ...starterLesson.words[2],
          id: "word-unsupported-key-pt-pt",
          canonicalText: "pa1",
          displayText: "PA1",
          syllables: ["PA1"],
          graphemes: ["p", "a", "1"],
          expectedKeys: ["P", "A", "1"],
          letterAudioEventIds: [
            "pt-PT.letter.p",
            "pt-PT.letter.a",
            "pt-PT.letter.a",
          ],
        },
        {
          ...starterLesson.words[3],
          id: "word-missing-word-audio-pt-pt",
          wordAudioEventId: "pt-PT.word.missing",
        },
      ],
    };

    const issues = validateStarterLesson(brokenLesson, ptPTAudioManifest);

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "curriculum.empty_target_sequence",
        itemId: "word-casa-pt-pt",
      }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "curriculum.duplicate_word_id",
        itemId: "word-casa-pt-pt",
      }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "curriculum.unsupported_target_key",
        itemId: "word-unsupported-key-pt-pt",
      }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "curriculum.missing_audio",
        itemId: "word-missing-word-audio-pt-pt",
      }),
    );
  });

  it("blocks release-ready items that still use unreviewed placeholder audio", () => {
    const releasePack: CurriculumPack = {
      ...ptPTStarterPack,
      items: [
        {
          ...ptPTStarterPack.items[0],
          status: "ready_for_release",
        },
      ],
    };

    expect(
      validateCurriculumPack(releasePack, ptPTAudioManifest),
    ).toContainEqual(
      expect.objectContaining({
        code: "curriculum.release_audio_not_approved",
        itemId: "word-casa-pt-pt",
      }),
    );
  });

  it("fails validation for duplicate word text and unsupported target keys", () => {
    const brokenPack: CurriculumPack = {
      ...ptPTStarterPack,
      items: [
        ptPTStarterPack.items[0],
        {
          ...ptPTStarterPack.items[1],
          id: "word-duplicate-casa-pt-pt",
          text: "casa",
          displayText: "CASA",
        },
        {
          ...ptPTStarterPack.items[2],
          id: "word-unsupported-key-pt-pt",
          text: "ca1",
          displayText: "CA1",
          graphemes: ["c", "a", "1"],
          targetSequence: ["c", "a", "1"],
          audio: {
            letters: ["pt-PT.letter.c", "pt-PT.letter.a", "pt-PT.letter.a"],
            syllables: ["pt-PT.syllable.ca"],
            word: "pt-PT.word.casa",
          },
          syllables: ["ca1"],
        },
      ],
    };

    const issues = validateCurriculumPack(brokenPack, ptPTAudioManifest);

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "curriculum.duplicate_word_text",
        itemId: "word-duplicate-casa-pt-pt",
      }),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "curriculum.unsupported_target_key",
        itemId: "word-unsupported-key-pt-pt",
      }),
    );
  });

  it("progresses correctly for each starter word from physical keyboard character events", () => {
    for (const item of ptPTStarterPack.items) {
      let state = createLessonState(item);

      for (const expectedKey of item.targetSequence) {
        const physicalKey = expectedKey.toLocaleUpperCase("pt-PT");
        const normalizedKey = normalizePhysicalKey({ key: physicalKey });

        expect(normalizedKey, `${item.id} accepts ${physicalKey}`).toBe(
          expectedKey,
        );

        const update = processLessonInput(item, state, normalizedKey);
        state = update.state;
      }

      expect(state.completed, `${item.id} completes`).toBe(true);
    }
  });
});
