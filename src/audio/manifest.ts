import { enGBStarterPack } from "../curriculum/enGBPack";
import { ptBRStarterPack } from "../curriculum/portuguesePacks";
import { ptPTYearOnePack } from "../curriculum/ptPTYearOnePack";
import type {
  CurriculumPack,
  LessonLocale,
  PortugueseLocale,
} from "../curriculum/types";
import type { AudioManifest, AudioManifestAsset } from "./types";

const COMMON_LETTER_AUDIO_TEXT: Record<string, string> = {
  a: "a",
  b: "bê",
  c: "cê",
  d: "dê",
  e: "e",
  f: "efe",
  h: "agá",
  i: "i",
  j: "jota",
  l: "ele",
  m: "eme",
  n: "ene",
  o: "o",
  p: "pê",
  q: "quê",
  r: "erre",
  s: "esse",
  t: "tê",
  u: "u",
  v: "vê",
  w: "dáblio",
  x: "xis",
  y: "ípsilon",
  z: "zê",
  á: "á",
  é: "é",
  í: "í",
  ó: "ó",
  ú: "ú",
  â: "â",
  ê: "ê",
  ô: "ô",
  ã: "ã",
  õ: "õ",
  à: "à",
  ç: "cê cedilhado",
};

const ENGLISH_LETTER_AUDIO_TEXT: Record<string, string> = {
  a: "ay",
  b: "bee",
  c: "see",
  d: "dee",
  e: "ee",
  f: "eff",
  g: "gee",
  h: "aitch",
  i: "eye",
  j: "jay",
  k: "kay",
  l: "ell",
  m: "em",
  n: "en",
  o: "oh",
  p: "pee",
  q: "cue",
  r: "ar",
  s: "ess",
  t: "tee",
  u: "you",
  v: "vee",
  w: "double you",
  x: "ex",
  y: "why",
  z: "zed",
};

const LOCALE_LETTER_AUDIO_TEXT: Record<
  PortugueseLocale,
  Partial<Record<string, string>>
> = {
  "pt-PT": {
    g: "guê",
    k: "capa",
  },
  "pt-BR": {
    g: "gê",
    k: "cá",
  },
};

const LETTER_PATH_SLUGS: Record<string, string> = {
  á: "a-agudo",
  é: "e-agudo",
  í: "i-agudo",
  ó: "o-agudo",
  ú: "u-agudo",
  â: "a-circunflexo",
  ê: "e-circunflexo",
  ô: "o-circunflexo",
  ã: "a-til",
  õ: "o-til",
  à: "a-grave",
  ç: "c-cedilha",
};

const KEYBOARD_LETTERS = [
  "q",
  "w",
  "e",
  "r",
  "t",
  "y",
  "u",
  "i",
  "o",
  "p",
  "a",
  "s",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "ç",
  "z",
  "x",
  "c",
  "v",
  "b",
  "n",
  "m",
  "á",
  "é",
  "í",
  "ó",
  "ú",
  "â",
  "ê",
  "ô",
  "ã",
  "õ",
  "à",
];
const ENGLISH_KEYBOARD_LETTERS = "qwertyuiopasdfghjklzxcvbnm".split("");

export const ptPTAudioManifest: AudioManifest = createAudioManifest(
  "pt-PT",
  ptPTYearOnePack,
);

export const ptBRAudioManifest: AudioManifest = createAudioManifest(
  "pt-BR",
  ptBRStarterPack,
);

export const enGBAudioManifest: AudioManifest = createAudioManifest(
  "en-GB",
  enGBStarterPack,
);

export const audioManifestsByLocale: Record<LessonLocale, AudioManifest> = {
  "pt-PT": ptPTAudioManifest,
  "pt-BR": ptBRAudioManifest,
  "en-GB": enGBAudioManifest,
};

function createAudioManifest(
  locale: LessonLocale,
  pack: CurriculumPack,
): AudioManifest {
  return {
    id: `${locale}-audio-v1`,
    locale,
    version: "0.1.0",
    assets: [
      ...createLetterAssets(locale),
      ...createSyllableAssets(locale, pack),
      ...createPartialAssets(locale, pack),
      ...createWordAssets(locale, pack),
      ...createFeedbackAssets(locale),
    ],
  };
}

function createLetterAssets(locale: LessonLocale): AudioManifestAsset[] {
  return [...new Set(getKeyboardLetters(locale))].map((letter) => ({
    id: `${locale}.letter.${letter}`,
    locale,
    kind: "letter",
    text: getLetterAudioText(locale, letter),
    path: `/audio/${locale}/letters/${LETTER_PATH_SLUGS[letter] ?? letter}.wav`,
    voice: getVoiceHint(locale),
    reviewStatus: "needs_review",
  }));
}

function createSyllableAssets(
  locale: LessonLocale,
  pack: CurriculumPack,
): AudioManifestAsset[] {
  const assets = new Map<string, AudioManifestAsset>();

  for (const item of pack.items) {
    item.audio.syllables?.forEach((audioId, index) => {
      if (!assets.has(audioId)) {
        const slug = audioId.replace(`${locale}.syllable.`, "");
        assets.set(audioId, {
          id: audioId,
          locale: item.locale,
          kind: "syllable",
          text: item.syllables?.[index] ?? slug,
          path: `/audio/${locale}/syllables/${slug}.wav`,
          voice: getVoiceHint(locale),
          reviewStatus: "needs_review",
        });
      }
    });
  }

  return [...assets.values()];
}

function createPartialAssets(
  locale: LessonLocale,
  pack: CurriculumPack,
): AudioManifestAsset[] {
  const assets = new Map<string, AudioManifestAsset>();

  for (const item of pack.items) {
    for (let index = 2; index < item.targetSequence.length; index += 1) {
      const partialText = item.targetSequence.slice(0, index).join("");
      const syllable = item.syllables?.find(
        (candidate) =>
          candidate.toLocaleLowerCase(locale) ===
          partialText.toLocaleLowerCase(locale),
      );

      if (syllable) {
        continue;
      }

      const slug = createAudioPathSlug(partialText);
      const audioId = `${locale}.partial.${slug}`;
      if (!assets.has(audioId)) {
        assets.set(audioId, {
          id: audioId,
          locale: item.locale,
          kind: "partial",
          text: partialText,
          path: `/audio/${locale}/partials/${slug}.wav`,
          voice: getVoiceHint(locale),
          reviewStatus: "needs_review",
        });
      }
    }
  }

  return [...assets.values()];
}

function createWordAssets(
  locale: LessonLocale,
  pack: CurriculumPack,
): AudioManifestAsset[] {
  return pack.items.map((item) => {
    const audioId = item.audio.word ?? `${locale}.word.${item.text}`;
    const slug = audioId.replace(`${locale}.word.`, "");

    return {
      id: audioId,
      locale: item.locale,
      kind: "word",
      text: item.text,
      path: `/audio/${locale}/words/${slug}.wav`,
      voice: getVoiceHint(locale),
      reviewStatus: "needs_review",
    };
  });
}

function createFeedbackAssets(locale: LessonLocale): AudioManifestAsset[] {
  return [...new Set(getKeyboardLetters(locale))].map((letter) => {
    const slug = LETTER_PATH_SLUGS[letter] ?? letter;
    const displayLetter = letter.toLocaleUpperCase(locale);

    return {
      id: `${locale}.feedback.need-letter.${slug}`,
      locale,
      kind: "feedback",
      text: getFeedbackAudioText(locale, displayLetter),
      path: `/audio/${locale}/feedback/${getFeedbackPath(locale, slug)}`,
      voice: getVoiceHint(locale),
      reviewStatus: "needs_review",
    };
  });
}

function getVoiceHint(locale: LessonLocale): string {
  if (locale === "en-GB") {
    return "Cori";
  }

  return locale === "pt-BR" ? "Luciana" : "Tugão";
}

function getLetterAudioText(locale: LessonLocale, letter: string): string {
  if (locale === "en-GB") {
    return ENGLISH_LETTER_AUDIO_TEXT[letter] ?? letter;
  }

  return (
    LOCALE_LETTER_AUDIO_TEXT[locale][letter] ??
    COMMON_LETTER_AUDIO_TEXT[letter] ??
    letter
  );
}

function getFeedbackAudioText(
  locale: LessonLocale,
  displayLetter: string,
): string {
  if (locale === "en-GB") {
    return `We need the letter ${displayLetter}.`;
  }

  return `Precisamos da letra ${displayLetter}.`;
}

function getFeedbackPath(locale: LessonLocale, slug: string): string {
  if (locale === "en-GB") {
    return `we-need-the-letter-${slug}.wav`;
  }

  return `precisamos-da-letra-${slug}.wav`;
}

function getKeyboardLetters(locale: LessonLocale): string[] {
  return locale === "en-GB" ? ENGLISH_KEYBOARD_LETTERS : KEYBOARD_LETTERS;
}

function createAudioPathSlug(text: string): string {
  return Array.from(text)
    .map((character) => LETTER_PATH_SLUGS[character] ?? character)
    .join("-");
}
