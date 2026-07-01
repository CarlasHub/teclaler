import type { CurriculumItem, CurriculumPack } from "./types";

export const enGBStarterPack: CurriculumPack = {
  id: "en-GB-starter-lesson-001",
  locale: "en-GB",
  version: "0.1.0",
  title: "First Words",
  items: [
    createEnglishWordItem({
      difficulty: 1,
      imageAlt: "A simple house.",
      imageAsset: "/images/house-simple.svg",
      order: 1,
      text: "house",
    }),
    createEnglishWordItem({
      difficulty: 1,
      imageAlt: "A simple bag.",
      imageAsset: "/images/bag-simple.svg",
      order: 2,
      text: "bag",
    }),
    createEnglishWordItem({
      difficulty: 1,
      imageAlt: "A simple duck.",
      imageAsset: "/images/duck-simple.svg",
      order: 3,
      text: "duck",
    }),
    createEnglishWordItem({
      difficulty: 1,
      imageAlt: "A simple toad.",
      imageAsset: "/images/toad-simple.svg",
      order: 4,
      text: "toad",
    }),
    createEnglishWordItem({
      difficulty: 1,
      imageAlt: "A simple ball.",
      imageAsset: "/images/ball-simple.svg",
      order: 5,
      text: "ball",
    }),
  ],
};

interface EnglishWordConfig {
  difficulty: number;
  imageAlt: string;
  imageAsset: string;
  order: number;
  text: string;
}

function createEnglishWordItem(config: EnglishWordConfig): CurriculumItem {
  const letters = Array.from(config.text);

  return {
    id: `word-${config.text}-en-gb`,
    type: "word",
    locale: "en-GB",
    text: config.text,
    displayText: config.text.toLocaleUpperCase("en-GB"),
    syllables: [config.text],
    graphemes: letters,
    targetSequence: letters,
    audio: {
      letters: letters.map((letter) => `en-GB.letter.${letter}`),
      syllables: [`en-GB.syllable.${config.text}`],
      word: `en-GB.word.${config.text}`,
    },
    imageAsset: config.imageAsset,
    imageAlt: config.imageAlt,
    difficulty: config.difficulty,
    status: "ready_for_dev",
  };
}
