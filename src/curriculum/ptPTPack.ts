import { starterLesson, type StarterLessonWord } from "./starterLesson";
import type { CurriculumItem, CurriculumPack } from "./types";

export const ptPTStarterItems: CurriculumItem[] = [...starterLesson.words]
  .sort((left, right) => left.order - right.order)
  .map(createWordItem);

export const casaItem: CurriculumItem = ptPTStarterItems[0];

export const ptPTStarterPack: CurriculumPack = {
  id: starterLesson.id,
  locale: starterLesson.portugueseVariant,
  version: "0.1.0",
  title: starterLesson.title,
  items: ptPTStarterItems,
};

function createWordItem(word: StarterLessonWord): CurriculumItem {
  return {
    id: word.id,
    type: "word",
    locale: word.portugueseVariant,
    text: word.canonicalText,
    displayText: word.displayText,
    syllables: word.syllables.map((syllable) =>
      syllable.toLocaleLowerCase("pt-PT"),
    ),
    graphemes: word.graphemes.map((grapheme) =>
      grapheme.toLocaleLowerCase("pt-PT"),
    ),
    targetSequence: word.expectedKeys.map((key) =>
      key.toLocaleLowerCase("pt-PT"),
    ),
    audio: {
      letters: word.letterAudioEventIds,
      syllables: word.syllableAudioEventIds,
      word: word.wordAudioEventId,
    },
    imageAsset: word.imageAsset,
    imageAlt: word.imageAlt,
    difficulty: word.difficulty,
    status: word.reviewStatus,
  };
}
