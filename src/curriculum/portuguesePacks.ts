import { enGBStarterPack } from "./enGBPack";
import { ptPTStarterPack } from "./ptPTPack";
import type {
  CurriculumAudioRefs,
  CurriculumItem,
  CurriculumPack,
  LessonLocale,
} from "./types";
import type { PortugueseLocale } from "./types";

export const supportedLessonLocales: LessonLocale[] = [
  "pt-PT",
  "pt-BR",
  "en-GB",
];
export const supportedPortugueseLocales: PortugueseLocale[] = [
  "pt-PT",
  "pt-BR",
];

export const ptBRStarterPack: CurriculumPack = createVariantPack(
  ptPTStarterPack,
  "pt-BR",
);

export const curriculumPacksByLocale: Record<LessonLocale, CurriculumPack> = {
  "pt-PT": ptPTStarterPack,
  "pt-BR": ptBRStarterPack,
  "en-GB": enGBStarterPack,
};

function createVariantPack(
  sourcePack: CurriculumPack,
  locale: PortugueseLocale,
): CurriculumPack {
  return {
    ...sourcePack,
    id: sourcePack.id.replace("pt-PT", locale),
    locale,
    items: sourcePack.items.map((item) => createVariantItem(item, locale)),
  };
}

function createVariantItem(
  item: CurriculumItem,
  locale: PortugueseLocale,
): CurriculumItem {
  return {
    ...item,
    id: item.id.replace("-pt-pt", `-${locale.toLocaleLowerCase("en-GB")}`),
    locale,
    audio: createVariantAudioRefs(item.audio, locale),
  };
}

function createVariantAudioRefs(
  audio: CurriculumAudioRefs,
  locale: PortugueseLocale,
): CurriculumAudioRefs {
  return {
    letters: audio.letters?.map((audioId) =>
      createVariantAudioId(audioId, locale),
    ),
    syllables: audio.syllables?.map((audioId) =>
      createVariantAudioId(audioId, locale),
    ),
    word: audio.word ? createVariantAudioId(audio.word, locale) : undefined,
    sentence: audio.sentence
      ? createVariantAudioId(audio.sentence, locale)
      : undefined,
  };
}

function createVariantAudioId(
  audioId: string,
  locale: PortugueseLocale,
): string {
  return audioId.replace(/^pt-PT\./u, `${locale}.`);
}
