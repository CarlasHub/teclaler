import { resolveAudioAsset } from "../audio/audioManifest";
import type { AudioManifest } from "../audio/types";
import {
  SUPPORTED_PORTUGUESE_KEY_VALUES,
  normalizePortugueseText,
} from "../engine/inputEngine";
import type { StarterLesson, StarterLessonWord } from "./starterLesson";
import type { CurriculumItem, CurriculumPack } from "./types";

const LOCAL_IMAGE_ASSET_PATTERN = /^\/images\/[^/]+\.svg$/u;

export interface ValidationIssue {
  code: string;
  itemId?: string;
  message: string;
}

export interface CurriculumValidationOptions {
  enforceReleaseAudioReview?: boolean;
}

export function validateCurriculumPack(
  pack: CurriculumPack,
  manifest: AudioManifest,
  options: CurriculumValidationOptions = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenItemIds = new Set<string>();
  const seenWordTexts = new Set<string>();

  for (const item of pack.items) {
    if (seenItemIds.has(item.id)) {
      issues.push({
        code: "curriculum.duplicate_item_id",
        itemId: item.id,
        message: `Duplicate curriculum item ID: ${item.id}`,
      });
    }
    seenItemIds.add(item.id);

    const wordKey = normalizePortugueseText(item.text);
    if (seenWordTexts.has(wordKey)) {
      issues.push({
        code: "curriculum.duplicate_word_text",
        itemId: item.id,
        message: `Duplicate starter word text: ${item.text}`,
      });
    }
    seenWordTexts.add(wordKey);

    issues.push(...validateCurriculumItem(pack, item, manifest, options));
  }

  return issues;
}

export function validateStarterLesson(
  lesson: StarterLesson,
  manifest: AudioManifest,
  options: CurriculumValidationOptions = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenWordIds = new Set<string>();
  const seenOrders = new Set<number>();
  const seenCanonicalTexts = new Set<string>();

  if (!lesson.id.trim()) {
    issues.push({
      code: "curriculum.empty_lesson_id",
      message: "Starter lesson must include an ID",
    });
  }

  for (const word of lesson.words) {
    if (seenWordIds.has(word.id)) {
      issues.push({
        code: "curriculum.duplicate_word_id",
        itemId: word.id,
        message: `Duplicate starter lesson word ID: ${word.id}`,
      });
    }
    seenWordIds.add(word.id);

    if (seenOrders.has(word.order)) {
      issues.push({
        code: "curriculum.duplicate_lesson_order",
        itemId: word.id,
        message: `Duplicate starter lesson order: ${word.order}`,
      });
    }
    seenOrders.add(word.order);

    const canonicalKey = normalize(word.canonicalText);
    if (seenCanonicalTexts.has(canonicalKey)) {
      issues.push({
        code: "curriculum.duplicate_word_text",
        itemId: word.id,
        message: `Duplicate starter word text: ${word.canonicalText}`,
      });
    }
    seenCanonicalTexts.add(canonicalKey);

    issues.push(...validateStarterLessonWord(lesson, word, manifest, options));
  }

  return issues;
}

function validateCurriculumItem(
  pack: CurriculumPack,
  item: CurriculumItem,
  manifest: AudioManifest,
  options: CurriculumValidationOptions,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (item.locale !== pack.locale) {
    issues.push({
      code: "curriculum.item_locale_mismatch",
      itemId: item.id,
      message: `${item.id} uses ${item.locale} inside ${pack.locale} pack`,
    });
  }

  if (manifest.locale !== item.locale) {
    issues.push({
      code: "curriculum.manifest_locale_mismatch",
      itemId: item.id,
      message: `${item.id} needs ${item.locale} audio, not ${manifest.locale}`,
    });
  }

  if (item.type !== "word") {
    issues.push({
      code: "curriculum.unsupported_item_type",
      itemId: item.id,
      message: `${item.id} must be a word item in the starter pack`,
    });
  }

  if (!item.imageAsset?.trim()) {
    issues.push({
      code: "curriculum.missing_image_asset",
      itemId: item.id,
      message: `${item.id} must include a local image asset`,
    });
  } else if (
    item.imageAsset &&
    !LOCAL_IMAGE_ASSET_PATTERN.test(item.imageAsset)
  ) {
    issues.push({
      code: "curriculum.invalid_image_asset",
      itemId: item.id,
      message: `${item.id} image asset must be a local SVG in /images`,
    });
  }

  if (!item.imageAlt?.trim()) {
    issues.push({
      code: "curriculum.missing_image_alt",
      itemId: item.id,
      message: `${item.id} must include accessible image text`,
    });
  }

  if (item.targetSequence.length === 0) {
    issues.push({
      code: "curriculum.empty_target_sequence",
      itemId: item.id,
      message: `${item.id} must include targetSequence`,
    });
  }

  if (normalize(item.displayText) !== normalize(item.text)) {
    issues.push({
      code: "curriculum.display_text_mismatch",
      itemId: item.id,
      message: `${item.id} displayText must match ${item.text}`,
    });
  }

  if (joinNormalized(item.targetSequence) !== normalize(item.text)) {
    issues.push({
      code: "curriculum.target_sequence_text_mismatch",
      itemId: item.id,
      message: `${item.id} targetSequence must spell ${item.text}`,
    });
  }

  if (joinNormalized(item.graphemes) !== normalize(item.text)) {
    issues.push({
      code: "curriculum.graphemes_text_mismatch",
      itemId: item.id,
      message: `${item.id} graphemes must spell ${item.text}`,
    });
  }

  if (
    !item.syllables?.length ||
    joinNormalized(item.syllables) !== normalize(item.text)
  ) {
    issues.push({
      code: "curriculum.syllables_text_mismatch",
      itemId: item.id,
      message: `${item.id} syllables must spell ${item.text}`,
    });
  }

  if ((item.audio.letters?.length ?? 0) !== item.targetSequence.length) {
    issues.push({
      code: "curriculum.letter_audio_count",
      itemId: item.id,
      message: `${item.id} must have one letter audio ID per target key`,
    });
  }

  if ((item.audio.syllables?.length ?? 0) !== (item.syllables?.length ?? 0)) {
    issues.push({
      code: "curriculum.syllable_audio_count",
      itemId: item.id,
      message: `${item.id} must have one syllable audio ID per syllable`,
    });
  }

  const audioIds = [
    ...(item.audio.letters ?? []),
    ...(item.audio.syllables ?? []),
    ...(item.audio.word ? [item.audio.word] : []),
  ];

  for (const audioId of audioIds) {
    const asset = resolveAudioAsset(manifest, audioId);

    if (!asset) {
      issues.push({
        code: "curriculum.missing_audio",
        itemId: item.id,
        message: `${item.id} references missing audio ID ${audioId}`,
      });
      continue;
    }

    if (asset.locale !== item.locale) {
      issues.push({
        code: "curriculum.audio_locale_mismatch",
        itemId: item.id,
        message: `${item.id} references ${asset.locale} audio ID ${audioId}`,
      });
    }

    if (
      options.enforceReleaseAudioReview !== false &&
      isReleaseCandidate(item) &&
      asset.reviewStatus !== "approved"
    ) {
      issues.push({
        code: "curriculum.release_audio_not_approved",
        itemId: item.id,
        message: `${item.id} cannot release with unapproved audio ID ${audioId}`,
      });
    }
  }

  for (const key of item.targetSequence) {
    const normalizedKey = normalizePortugueseText(key);
    if (!SUPPORTED_PORTUGUESE_KEY_VALUES.has(normalizedKey)) {
      issues.push({
        code: "curriculum.unsupported_target_key",
        itemId: item.id,
        message: `${item.id} uses unsupported lesson keyboard key ${key}`,
      });
    }
  }

  return issues;
}

function validateStarterLessonWord(
  lesson: StarterLesson,
  word: StarterLessonWord,
  manifest: AudioManifest,
  options: CurriculumValidationOptions,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (word.portugueseVariant !== lesson.portugueseVariant) {
    issues.push({
      code: "curriculum.word_locale_mismatch",
      itemId: word.id,
      message: `${word.id} uses ${word.portugueseVariant} inside ${lesson.portugueseVariant} lesson`,
    });
  }

  if (!word.expectedKeys.length) {
    issues.push({
      code: "curriculum.empty_target_sequence",
      itemId: word.id,
      message: `${word.id} must include expectedKeys`,
    });
  }

  if (!word.imageAsset?.trim()) {
    issues.push({
      code: "curriculum.missing_image_asset",
      itemId: word.id,
      message: `${word.id} must include a local image asset`,
    });
  } else if (!LOCAL_IMAGE_ASSET_PATTERN.test(word.imageAsset)) {
    issues.push({
      code: "curriculum.invalid_image_asset",
      itemId: word.id,
      message: `${word.id} image asset must be a local SVG in /images`,
    });
  }

  if (!word.imageAlt?.trim()) {
    issues.push({
      code: "curriculum.missing_image_alt",
      itemId: word.id,
      message: `${word.id} must include accessible image text`,
    });
  }

  if (normalize(word.displayText) !== normalize(word.canonicalText)) {
    issues.push({
      code: "curriculum.display_text_mismatch",
      itemId: word.id,
      message: `${word.id} displayText must match ${word.canonicalText}`,
    });
  }

  if (word.canonicalText !== normalize(word.canonicalText)) {
    issues.push({
      code: "curriculum.canonical_text_not_lowercase",
      itemId: word.id,
      message: `${word.id} canonicalText must be lowercase`,
    });
  }

  if (word.displayText !== word.canonicalText.toLocaleUpperCase("pt-PT")) {
    issues.push({
      code: "curriculum.display_text_not_uppercase",
      itemId: word.id,
      message: `${word.id} displayText must be uppercase`,
    });
  }

  if (joinNormalized(word.expectedKeys) !== normalize(word.canonicalText)) {
    issues.push({
      code: "curriculum.target_sequence_text_mismatch",
      itemId: word.id,
      message: `${word.id} expectedKeys must spell ${word.canonicalText}`,
    });
  }

  if (!word.syllables.length) {
    issues.push({
      code: "curriculum.empty_syllables",
      itemId: word.id,
      message: `${word.id} must include syllables`,
    });
  } else if (joinNormalized(word.syllables) !== normalize(word.canonicalText)) {
    issues.push({
      code: "curriculum.syllables_text_mismatch",
      itemId: word.id,
      message: `${word.id} syllables must spell ${word.canonicalText}`,
    });
  }

  for (const syllable of word.syllables) {
    if (syllable !== syllable.toLocaleUpperCase("pt-PT")) {
      issues.push({
        code: "curriculum.syllable_not_uppercase",
        itemId: word.id,
        message: `${word.id} syllable ${syllable} must be uppercase`,
      });
    }
  }

  if (
    !word.graphemes.length ||
    joinNormalized(word.graphemes) !== normalize(word.canonicalText)
  ) {
    issues.push({
      code: "curriculum.graphemes_text_mismatch",
      itemId: word.id,
      message: `${word.id} graphemes must spell ${word.canonicalText}`,
    });
  }

  if (word.letterAudioEventIds.length !== word.expectedKeys.length) {
    issues.push({
      code: "curriculum.letter_audio_count",
      itemId: word.id,
      message: `${word.id} must have one letter audio ID per expected key`,
    });
  }

  if (word.syllableAudioEventIds.length !== word.syllables.length) {
    issues.push({
      code: "curriculum.syllable_audio_count",
      itemId: word.id,
      message: `${word.id} must have one syllable audio ID per syllable`,
    });
  }

  if (!word.wordAudioEventId.trim()) {
    issues.push({
      code: "curriculum.empty_word_audio_id",
      itemId: word.id,
      message: `${word.id} must include wordAudioEventId`,
    });
  }

  for (const key of word.expectedKeys) {
    const normalizedKey = normalizePortugueseText(key);
    if (key !== key.toLocaleUpperCase("pt-PT")) {
      issues.push({
        code: "curriculum.target_key_not_uppercase",
        itemId: word.id,
        message: `${word.id} expected key ${key} must be uppercase`,
      });
    }

    if (!SUPPORTED_PORTUGUESE_KEY_VALUES.has(normalizedKey)) {
      issues.push({
        code: "curriculum.unsupported_target_key",
        itemId: word.id,
        message: `${word.id} uses unsupported lesson keyboard key ${key}`,
      });
    }
  }

  const audioIds = [
    ...word.letterAudioEventIds,
    ...word.syllableAudioEventIds,
    word.wordAudioEventId,
  ].filter(Boolean);

  for (const audioId of audioIds) {
    const asset = resolveAudioAsset(manifest, audioId);

    if (!asset) {
      issues.push({
        code: "curriculum.missing_audio",
        itemId: word.id,
        message: `${word.id} references missing audio ID ${audioId}`,
      });
      continue;
    }

    if (asset.locale !== word.portugueseVariant) {
      issues.push({
        code: "curriculum.audio_locale_mismatch",
        itemId: word.id,
        message: `${word.id} references ${asset.locale} audio ID ${audioId}`,
      });
    }

    if (
      options.enforceReleaseAudioReview !== false &&
      isStarterLessonReleaseCandidate(word) &&
      asset.reviewStatus !== "approved"
    ) {
      issues.push({
        code: "curriculum.release_audio_not_approved",
        itemId: word.id,
        message: `${word.id} cannot release with unapproved audio ID ${audioId}`,
      });
    }
  }

  return issues;
}

function isReleaseCandidate(item: CurriculumItem): boolean {
  return item.status === "ready_for_release" || item.status === "released";
}

function isStarterLessonReleaseCandidate(word: StarterLessonWord): boolean {
  return (
    word.reviewStatus === "ready_for_release" ||
    word.reviewStatus === "released"
  );
}

function joinNormalized(parts: string[]): string {
  return normalize(parts.join(""));
}

function normalize(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("pt-PT");
}
