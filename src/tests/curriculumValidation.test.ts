import { describe, expect, it } from "vitest";
import {
  audioManifestsByLocale,
  enGBAudioManifest,
  ptBRAudioManifest,
  ptPTAudioManifest,
} from "../audio/manifest";
import type { AudioManifest } from "../audio/types";
import { validateAudioManifest } from "../audio/validators";
import { resolveAudioAsset } from "../audio/audioManifest";
import {
  curriculumPacksByLocale,
  supportedLessonLocales,
  ptBRStarterPack,
  supportedPortugueseLocales,
} from "../curriculum/portuguesePacks";
import { enGBStarterPack } from "../curriculum/enGBPack";
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
const EXPECTED_ENGLISH_STARTER_WORDS = ["house", "bag", "duck", "toad", "ball"];

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
    expect(ptPTStarterPack.items.map((item) => item.imageAsset)).toEqual(
      starterLesson.words.map((word) => word.imageAsset),
    );
    expect(ptPTStarterPack.items.every((item) => item.imageAlt?.trim())).toBe(
      true,
    );
  });

  it("provides separate lesson packs without mixing locale audio IDs", () => {
    expect(supportedPortugueseLocales).toEqual(["pt-PT", "pt-BR"]);
    expect(supportedLessonLocales).toEqual(["pt-PT", "pt-BR", "en-GB"]);
    expect(ptBRStarterPack.locale).toBe("pt-BR");
    expect(ptBRStarterPack.items.map((item) => item.text)).toEqual(
      EXPECTED_STARTER_WORDS,
    );

    for (const item of ptBRStarterPack.items) {
      expect(item.id).toMatch(/-pt-br$/);
      expect(item.locale).toBe("pt-BR");

      const audioIds = [
        ...(item.audio.letters ?? []),
        ...(item.audio.syllables ?? []),
        item.audio.word,
      ].filter(Boolean);

      expect(audioIds.every((audioId) => audioId?.startsWith("pt-BR."))).toBe(
        true,
      );
    }

    expect(enGBStarterPack.locale).toBe("en-GB");
    expect(enGBStarterPack.items.map((item) => item.text)).toEqual(
      EXPECTED_ENGLISH_STARTER_WORDS,
    );

    for (const item of enGBStarterPack.items) {
      expect(item.id).toMatch(/-en-gb$/);
      expect(item.locale).toBe("en-GB");
      expect(item.displayText).toBe(item.text.toLocaleUpperCase("en-GB"));
      expect(item.targetSequence.join("")).toBe(item.text);
      expect(item.graphemes.join("")).toBe(item.text);
      expect(item.syllables?.join("")).toBe(item.text);

      const audioIds = [
        ...(item.audio.letters ?? []),
        ...(item.audio.syllables ?? []),
        item.audio.word,
      ].filter(Boolean);

      expect(audioIds.every((audioId) => audioId?.startsWith("en-GB."))).toBe(
        true,
      );
    }
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
      expect(word.imageAlt.trim().length).toBeGreaterThan(0);
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
    expect(validateAudioManifest(ptBRAudioManifest)).toEqual([]);
    expect(validateAudioManifest(enGBAudioManifest)).toEqual([]);
    expect(validateStarterLesson(starterLesson, ptPTAudioManifest)).toEqual([]);

    for (const locale of supportedLessonLocales) {
      expect(
        validateCurriculumPack(
          curriculumPacksByLocale[locale],
          audioManifestsByLocale[locale],
        ),
      ).toEqual([]);
    }
  });

  it("uses reviewed Portuguese letter audio text without adding accents to plain vowels", () => {
    const expectedPtPTLetterNames = {
      "pt-PT.letter.a": "a",
      "pt-PT.letter.e": "e",
      "pt-PT.letter.g": "guê",
      "pt-PT.letter.k": "capa",
      "pt-PT.letter.o": "o",
      "pt-PT.letter.ç": "cê cedilhado",
    };
    const expectedPtBRLetterNames = {
      "pt-BR.letter.a": "a",
      "pt-BR.letter.e": "e",
      "pt-BR.letter.g": "gê",
      "pt-BR.letter.k": "cá",
      "pt-BR.letter.o": "o",
      "pt-BR.letter.ç": "cê cedilhado",
    };

    for (const [audioId, text] of Object.entries(expectedPtPTLetterNames)) {
      expect(resolveAudioAsset(ptPTAudioManifest, audioId)?.text).toBe(text);
    }

    for (const [audioId, text] of Object.entries(expectedPtBRLetterNames)) {
      expect(resolveAudioAsset(ptBRAudioManifest, audioId)?.text).toBe(text);
    }
  });

  it("keeps pt-BR placeholder audio on Brazilian Portuguese voice assets", () => {
    expect(
      ptBRAudioManifest.assets.every(
        (asset) =>
          asset.locale === "pt-BR" &&
          asset.path.startsWith("/audio/pt-BR/") &&
          asset.voice === "Luciana",
      ),
    ).toBe(true);
  });

  it("keeps en-GB placeholder audio in English paths with an English voice hint", () => {
    expect(
      enGBAudioManifest.assets.every(
        (asset) =>
          asset.locale === "en-GB" &&
          asset.path.startsWith("/audio/en-GB/") &&
          asset.voice === "Shelley",
      ),
    ).toBe(true);
    expect(resolveAudioAsset(enGBAudioManifest, "en-GB.letter.h")?.text).toBe(
      "aitch",
    );
    expect(resolveAudioAsset(enGBAudioManifest, "en-GB.word.house")?.text).toBe(
      "house",
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
        {
          ...starterLesson.words[4],
          id: "word-missing-image-alt-pt-pt",
          imageAlt: "",
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
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "curriculum.missing_image_alt",
        itemId: "word-missing-image-alt-pt-pt",
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
