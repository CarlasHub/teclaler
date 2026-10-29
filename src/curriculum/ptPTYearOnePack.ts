import { ptPTStarterItems } from "./ptPTPack";
import type { CurriculumItem, CurriculumPack } from "./types";

interface WordDraft {
  text: string;
  syllables: string[];
  stage: 2 | 3 | 4;
  graphemes?: string[];
}

// Original practice vocabulary, grouped by the reading skill being introduced.
// The draft words and generated pronunciation require educator review before a child pilot.
const wordDrafts: WordDraft[] = [
  { text: "mesa", syllables: ["me", "sa"], stage: 2 },
  { text: "lata", syllables: ["la", "ta"], stage: 2 },
  { text: "mapa", syllables: ["ma", "pa"], stage: 2 },
  { text: "mimo", syllables: ["mi", "mo"], stage: 2 },
  { text: "vela", syllables: ["ve", "la"], stage: 2 },
  { text: "nave", syllables: ["na", "ve"], stage: 2 },
  { text: "foca", syllables: ["fo", "ca"], stage: 2 },
  { text: "gato", syllables: ["ga", "to"], stage: 2 },
  { text: "dado", syllables: ["da", "do"], stage: 2 },
  { text: "fada", syllables: ["fa", "da"], stage: 2 },
  { text: "copo", syllables: ["co", "po"], stage: 2 },
  { text: "bota", syllables: ["bo", "ta"], stage: 2 },
  { text: "nota", syllables: ["no", "ta"], stage: 2 },
  { text: "rato", syllables: ["ra", "to"], stage: 2 },
  { text: "rosa", syllables: ["ro", "sa"], stage: 2 },
  { text: "pata", syllables: ["pa", "ta"], stage: 2 },
  { text: "sala", syllables: ["sa", "la"], stage: 2 },
  { text: "tela", syllables: ["te", "la"], stage: 2 },
  { text: "mula", syllables: ["mu", "la"], stage: 2 },
  { text: "lobo", syllables: ["lo", "bo"], stage: 2 },
  { text: "cama", syllables: ["ca", "ma"], stage: 2 },
  { text: "lupa", syllables: ["lu", "pa"], stage: 2 },
  { text: "faca", syllables: ["fa", "ca"], stage: 2 },
  { text: "vida", syllables: ["vi", "da"], stage: 2 },
  { text: "toma", syllables: ["to", "ma"], stage: 2 },
  { text: "lua", syllables: ["lu", "a"], stage: 3 },
  {
    text: "leão",
    syllables: ["le", "ão"],
    stage: 3,
    graphemes: ["l", "e", "ã", "o"],
  },
  { text: "cão", syllables: ["cão"], stage: 3 },
  { text: "mãe", syllables: ["mãe"], stage: 3 },
  { text: "pão", syllables: ["pão"], stage: 3 },
  { text: "avó", syllables: ["a", "vó"], stage: 3 },
  { text: "avô", syllables: ["a", "vô"], stage: 3 },
  { text: "café", syllables: ["ca", "fé"], stage: 3 },
  { text: "maçã", syllables: ["ma", "çã"], stage: 3 },
  { text: "lã", syllables: ["lã"], stage: 3 },
  { text: "pé", syllables: ["pé"], stage: 3 },
  { text: "céu", syllables: ["céu"], stage: 3 },
  { text: "mão", syllables: ["mão"], stage: 3 },
  { text: "botão", syllables: ["bo", "tão"], stage: 3 },
  { text: "chá", syllables: ["chá"], stage: 4, graphemes: ["ch", "á"] },
  {
    text: "chave",
    syllables: ["cha", "ve"],
    stage: 4,
    graphemes: ["ch", "a", "v", "e"],
  },
  {
    text: "filho",
    syllables: ["fi", "lho"],
    stage: 4,
    graphemes: ["f", "i", "lh", "o"],
  },
  {
    text: "ninho",
    syllables: ["ni", "nho"],
    stage: 4,
    graphemes: ["n", "i", "nh", "o"],
  },
  {
    text: "banho",
    syllables: ["ba", "nho"],
    stage: 4,
    graphemes: ["b", "a", "nh", "o"],
  },
  {
    text: "carro",
    syllables: ["car", "ro"],
    stage: 4,
    graphemes: ["c", "a", "rr", "o"],
  },
  {
    text: "massa",
    syllables: ["mas", "sa"],
    stage: 4,
    graphemes: ["m", "a", "ss", "a"],
  },
  {
    text: "terra",
    syllables: ["ter", "ra"],
    stage: 4,
    graphemes: ["t", "e", "rr", "a"],
  },
  { text: "prato", syllables: ["pra", "to"], stage: 4 },
  { text: "livro", syllables: ["li", "vro"], stage: 4 },
  { text: "flor", syllables: ["flor"], stage: 4 },
  { text: "trapo", syllables: ["tra", "po"], stage: 4 },
];

export const ptPTPracticeItems: CurriculumItem[] = wordDrafts.map((draft) => {
  const targetSequence = Array.from(draft.text);
  return {
    id: `word-${draft.text}-pt-pt`,
    type: "word",
    locale: "pt-PT",
    text: draft.text,
    displayText: draft.text.toLocaleUpperCase("pt-PT"),
    syllables: draft.syllables,
    graphemes: draft.graphemes ?? targetSequence,
    targetSequence,
    audio: {
      letters: targetSequence.map((letter) => `pt-PT.letter.${letter}`),
      syllables: draft.syllables.map(
        (syllable) => `pt-PT.syllable.${syllable}`,
      ),
      word: `pt-PT.word.${draft.text}`,
    },
    difficulty: draft.stage,
    status: "pedagogy_review",
  };
});

export const ptPTYearOnePack: CurriculumPack = {
  id: "pt-PT-year-one",
  locale: "pt-PT",
  version: "0.2.0",
  title: "Primeiro ano: palavras e sílabas",
  items: [...ptPTStarterItems, ...ptPTPracticeItems],
};

export const ptPTStages = [
  { id: 1, title: "Primeiras palavras", description: "Palavras com imagem" },
  {
    id: 2,
    title: "Sílabas simples",
    description: "Junta sílabas para formar palavras",
  },
  {
    id: 3,
    title: "Acentos e sons nasais",
    description: "Lê e escreve novos sons",
  },
  {
    id: 4,
    title: "Novos grupos de letras",
    description: "Ch, lh, nh e outros desafios",
  },
] as const;
