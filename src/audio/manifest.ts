import { ptPTStarterPack } from "../curriculum/ptPTPack";
import type { AudioManifest, AudioManifestAsset } from "./types";

const LETTER_AUDIO_TEXT: Record<string, string> = {
  a: "a",
  b: "bê",
  c: "cê",
  d: "dê",
  e: "e",
  f: "efe",
  g: "gê",
  h: "agá",
  i: "i",
  j: "jota",
  k: "capa",
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
  ç: "cê com cedilha",
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

export const ptPTAudioManifest: AudioManifest = {
  id: "pt-PT-audio-v1",
  locale: "pt-PT",
  version: "0.1.0",
  assets: [
    ...createLetterAssets(),
    ...createSyllableAssets(),
    ...createWordAssets(),
  ],
};

function createLetterAssets(): AudioManifestAsset[] {
  return [...new Set(KEYBOARD_LETTERS)].map((letter) => ({
    id: `pt-PT.letter.${letter}`,
    locale: "pt-PT",
    kind: "letter",
    text: LETTER_AUDIO_TEXT[letter],
    path: `/audio/pt-PT/letters/${LETTER_PATH_SLUGS[letter] ?? letter}.mp3`,
    reviewStatus: "needs_review",
  }));
}

function createSyllableAssets(): AudioManifestAsset[] {
  const assets = new Map<string, AudioManifestAsset>();

  for (const item of ptPTStarterPack.items) {
    item.audio.syllables?.forEach((audioId, index) => {
      if (!assets.has(audioId)) {
        const slug = audioId.replace("pt-PT.syllable.", "");
        assets.set(audioId, {
          id: audioId,
          locale: item.locale,
          kind: "syllable",
          text: item.syllables?.[index] ?? slug,
          path: `/audio/pt-PT/syllables/${slug}.mp3`,
          reviewStatus: "needs_review",
        });
      }
    });
  }

  return [...assets.values()];
}

function createWordAssets(): AudioManifestAsset[] {
  return ptPTStarterPack.items.map((item) => {
    const audioId = item.audio.word ?? `pt-PT.word.${item.text}`;
    const slug = audioId.replace("pt-PT.word.", "");

    return {
      id: audioId,
      locale: item.locale,
      kind: "word",
      text: item.text,
      path: `/audio/pt-PT/words/${slug}.mp3`,
      reviewStatus: "needs_review",
    };
  });
}
