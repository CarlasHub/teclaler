import { ptPTAudioManifest } from "../src/audio/manifest";
import { validateAudioManifest } from "../src/audio/validators";
import { ptPTStarterPack } from "../src/curriculum/ptPTPack";
import { starterLesson } from "../src/curriculum/starterLesson";
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
const packs = [
  releaseMode ? forcePackIntoReleaseMode(ptPTStarterPack) : ptPTStarterPack,
];
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
  console.log(
    `Content validation passed: ${lessons.length} starter lesson(s), ${packs.length} lesson pack(s), ${itemCount} word item(s), ${ptPTAudioManifest.assets.length} audio manifest item(s).`,
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

  for (const issue of validateAudioManifest(ptPTAudioManifest)) {
    issues.push({ ...issue, scope: "audio" });
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

    for (const issue of validateStarterLesson(lesson, ptPTAudioManifest, {
      enforceReleaseAudioReview: false,
    })) {
      issues.push({ ...issue, scope: "curriculum" });
    }
  }

  for (const pack of packsToValidate) {
    for (const issue of validateCurriculumPack(pack, ptPTAudioManifest)) {
      issues.push({ ...issue, scope: "curriculum" });
    }
  }

  return issues;
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
