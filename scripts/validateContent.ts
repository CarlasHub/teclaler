import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  audioManifestsByLocale,
  ptPTAudioManifest,
} from "../src/audio/manifest";
import { validateAudioManifest } from "../src/audio/validators";
import {
  curriculumPacksByLocale,
  supportedLessonLocales,
} from "../src/curriculum/portuguesePacks";
import { starterLesson } from "../src/curriculum/starterLesson";
import { ptPTYearOnePack } from "../src/curriculum/ptPTYearOnePack";
import type { CurriculumPack } from "../src/curriculum/types";
import {
  type ValidationIssue,
  validateCurriculumPack,
  validateStarterLesson,
} from "../src/curriculum/validators";

interface ContentValidationIssue extends ValidationIssue {
  scope: "audio" | "curriculum" | "lesson";
}

const releaseMode = process.argv.includes("--release");
const lessons = [starterLesson];
const packs = supportedLessonLocales.map((locale) => {
  const pack = curriculumPacksByLocale[locale];
  return releaseMode ? forcePackIntoReleaseMode(pack) : pack;
});
packs.push(
  releaseMode ? forcePackIntoReleaseMode(ptPTYearOnePack) : ptPTYearOnePack,
);
const issues = validateContent(lessons, packs);

if (issues.length > 0) {
  console.error(`Content validation failed with ${issues.length} issue(s):`);

  for (const issue of issues) {
    const item = issue.itemId ? ` ${issue.itemId}` : "";
    console.error(`- [${issue.scope}:${issue.code}]${item} ${issue.message}`);
  }

  process.exitCode = 1;
} else {
  const itemCount = packs.reduce((count, pack) => count + pack.items.length, 0);
  const audioItemCount = Object.values(audioManifestsByLocale).reduce(
    (count, manifest) => count + manifest.assets.length,
    0,
  );
  console.log(
    `Content validation passed: ${lessons.length} starter lesson(s), ${packs.length} lesson pack(s), ${itemCount} word item(s), ${audioItemCount} audio manifest item(s).`,
  );

  if (releaseMode) {
    console.log(
      "Release mode: reviewed audio is enforced for every starter item.",
    );
  }
}

function validateContent(
  lessonsToValidate: typeof lessons,
  packsToValidate: CurriculumPack[],
): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const seenLessonIds = new Set<string>();

  for (const manifest of Object.values(audioManifestsByLocale)) {
    for (const issue of validateAudioManifest(manifest)) {
      issues.push({ ...issue, scope: "audio" });
    }

    for (const asset of manifest.assets) {
      issues.push(...validateLocalAudioFile(asset.id, asset.path));
    }
  }

  for (const lesson of lessonsToValidate) {
    if (seenLessonIds.has(lesson.id)) {
      issues.push({
        code: "duplicate_lesson_id",
        message: `Duplicate lesson ID: ${lesson.id}`,
        scope: "lesson",
      });
    }
    seenLessonIds.add(lesson.id);

    for (const word of lesson.words) {
      issues.push(
        ...validateLocalImageFile("lesson", word.id, word.imageAsset),
      );
    }

    for (const issue of validateStarterLesson(lesson, ptPTAudioManifest, {
      enforceReleaseAudioReview: false,
    })) {
      issues.push({ ...issue, scope: "curriculum" });
    }
  }

  for (const pack of packsToValidate) {
    const manifest = audioManifestsByLocale[pack.locale];

    for (const item of pack.items) {
      issues.push(
        ...validateLocalImageFile("curriculum", item.id, item.imageAsset),
      );
    }

    for (const issue of validateCurriculumPack(pack, manifest)) {
      issues.push({ ...issue, scope: "curriculum" });
    }
  }

  return issues;
}

function validateLocalAudioFile(
  audioId: string,
  audioAsset: string,
): ContentValidationIssue[] {
  const localPublicPath = join(
    process.cwd(),
    "public",
    audioAsset.replace(/^\//u, ""),
  );

  if (existsSync(localPublicPath)) {
    return [];
  }

  return [
    {
      code: "missing_audio_file",
      itemId: audioId,
      message: `${audioId} references missing local audio file ${audioAsset}`,
      scope: "audio",
    },
  ];
}

function validateLocalImageFile(
  scope: ContentValidationIssue["scope"],
  itemId: string,
  imageAsset: string | undefined,
): ContentValidationIssue[] {
  if (!imageAsset) {
    return [];
  }

  const localPublicPath = join(
    process.cwd(),
    "public",
    imageAsset.replace(/^\//u, ""),
  );

  if (existsSync(localPublicPath)) {
    return [];
  }

  return [
    {
      code: "missing_image_file",
      itemId,
      message: `${itemId} references missing local image file ${imageAsset}`,
      scope,
    },
  ];
}

function forcePackIntoReleaseMode(pack: CurriculumPack): CurriculumPack {
  return {
    ...pack,
    items: pack.items.map((item) => ({
      ...item,
      status: "ready_for_release",
    })),
  };
}
