export type PortugueseLocale = "pt-PT" | "pt-BR";
export type LessonLocale = PortugueseLocale | "en-GB";

export type CurriculumItemType = "letter" | "syllable" | "word" | "sentence";

export type CurriculumReviewStatus =
  | "draft"
  | "pedagogy_review"
  | "pronunciation_review"
  | "ready_for_dev"
  | "ready_for_release"
  | "released"
  | "retired";

export interface CurriculumAudioRefs {
  letters?: string[];
  syllables?: string[];
  word?: string;
  sentence?: string;
}

export interface CurriculumItem {
  id: string;
  type: CurriculumItemType;
  locale: LessonLocale;
  text: string;
  displayText: string;
  syllables?: string[];
  graphemes: string[];
  targetSequence: string[];
  audio: CurriculumAudioRefs;
  imageId?: string;
  imageAsset?: string;
  imageAlt?: string;
  difficulty: number;
  status: CurriculumReviewStatus;
}

export interface CurriculumPack {
  id: string;
  locale: LessonLocale;
  version: string;
  title: string;
  items: CurriculumItem[];
}
