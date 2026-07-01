import type { CurriculumReviewStatus, PortugueseLocale } from "./types";

export interface StarterLessonWord {
  id: string;
  displayText: string;
  canonicalText: string;
  syllables: string[];
  graphemes: string[];
  expectedKeys: string[];
  imageAsset: string;
  imageAlt: string;
  letterAudioEventIds: string[];
  syllableAudioEventIds: string[];
  wordAudioEventId: string;
  portugueseVariant: PortugueseLocale;
  difficulty: number;
  order: number;
  reviewStatus: CurriculumReviewStatus;
}

export interface StarterLesson {
  id: string;
  title: string;
  portugueseVariant: PortugueseLocale;
  words: StarterLessonWord[];
}

export const starterLessonWords: StarterLessonWord[] = [
  {
    id: "word-casa-pt-pt",
    displayText: "CASA",
    canonicalText: "casa",
    syllables: ["CA", "SA"],
    graphemes: ["c", "a", "s", "a"],
    expectedKeys: ["C", "A", "S", "A"],
    imageAsset: "/images/house-simple.svg",
    imageAlt: "Uma casa simples.",
    letterAudioEventIds: [
      "pt-PT.letter.c",
      "pt-PT.letter.a",
      "pt-PT.letter.s",
      "pt-PT.letter.a",
    ],
    syllableAudioEventIds: ["pt-PT.syllable.ca", "pt-PT.syllable.sa"],
    wordAudioEventId: "pt-PT.word.casa",
    portugueseVariant: "pt-PT",
    difficulty: 1,
    order: 1,
    reviewStatus: "ready_for_dev",
  },
  {
    id: "word-mala-pt-pt",
    displayText: "MALA",
    canonicalText: "mala",
    syllables: ["MA", "LA"],
    graphemes: ["m", "a", "l", "a"],
    expectedKeys: ["M", "A", "L", "A"],
    imageAsset: "/images/bag-simple.svg",
    imageAlt: "Uma mala simples.",
    letterAudioEventIds: [
      "pt-PT.letter.m",
      "pt-PT.letter.a",
      "pt-PT.letter.l",
      "pt-PT.letter.a",
    ],
    syllableAudioEventIds: ["pt-PT.syllable.ma", "pt-PT.syllable.la"],
    wordAudioEventId: "pt-PT.word.mala",
    portugueseVariant: "pt-PT",
    difficulty: 1,
    order: 2,
    reviewStatus: "ready_for_dev",
  },
  {
    id: "word-pato-pt-pt",
    displayText: "PATO",
    canonicalText: "pato",
    syllables: ["PA", "TO"],
    graphemes: ["p", "a", "t", "o"],
    expectedKeys: ["P", "A", "T", "O"],
    imageAsset: "/images/duck-simple.svg",
    imageAlt: "Um pato simples.",
    letterAudioEventIds: [
      "pt-PT.letter.p",
      "pt-PT.letter.a",
      "pt-PT.letter.t",
      "pt-PT.letter.o",
    ],
    syllableAudioEventIds: ["pt-PT.syllable.pa", "pt-PT.syllable.to"],
    wordAudioEventId: "pt-PT.word.pato",
    portugueseVariant: "pt-PT",
    difficulty: 1,
    order: 3,
    reviewStatus: "ready_for_dev",
  },
  {
    id: "word-sapo-pt-pt",
    displayText: "SAPO",
    canonicalText: "sapo",
    syllables: ["SA", "PO"],
    graphemes: ["s", "a", "p", "o"],
    expectedKeys: ["S", "A", "P", "O"],
    imageAsset: "/images/toad-simple.svg",
    imageAlt: "Um sapo simples.",
    letterAudioEventIds: [
      "pt-PT.letter.s",
      "pt-PT.letter.a",
      "pt-PT.letter.p",
      "pt-PT.letter.o",
    ],
    syllableAudioEventIds: ["pt-PT.syllable.sa", "pt-PT.syllable.po"],
    wordAudioEventId: "pt-PT.word.sapo",
    portugueseVariant: "pt-PT",
    difficulty: 1,
    order: 4,
    reviewStatus: "ready_for_dev",
  },
  {
    id: "word-bola-pt-pt",
    displayText: "BOLA",
    canonicalText: "bola",
    syllables: ["BO", "LA"],
    graphemes: ["b", "o", "l", "a"],
    expectedKeys: ["B", "O", "L", "A"],
    imageAsset: "/images/ball-simple.svg",
    imageAlt: "Uma bola simples.",
    letterAudioEventIds: [
      "pt-PT.letter.b",
      "pt-PT.letter.o",
      "pt-PT.letter.l",
      "pt-PT.letter.a",
    ],
    syllableAudioEventIds: ["pt-PT.syllable.bo", "pt-PT.syllable.la"],
    wordAudioEventId: "pt-PT.word.bola",
    portugueseVariant: "pt-PT",
    difficulty: 1,
    order: 5,
    reviewStatus: "ready_for_dev",
  },
];

export const starterLesson: StarterLesson = {
  id: "pt-PT-starter-lesson-001",
  title: "Primeiras Palavras",
  portugueseVariant: "pt-PT",
  words: starterLessonWords,
};
