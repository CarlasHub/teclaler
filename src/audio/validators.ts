import type { AudioManifest } from "./types";

export interface ValidationIssue {
  code: string;
  message: string;
}

export function validateAudioManifest(
  manifest: AudioManifest,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();

  for (const asset of manifest.assets) {
    if (seenIds.has(asset.id)) {
      issues.push({
        code: "audio.duplicate_id",
        message: `Duplicate audio asset ID: ${asset.id}`,
      });
    }
    seenIds.add(asset.id);

    if (asset.locale !== manifest.locale) {
      issues.push({
        code: "audio.locale_mismatch",
        message: `${asset.id} uses ${asset.locale} inside ${manifest.locale} manifest`,
      });
    }

    if (!asset.id.startsWith(`${asset.locale}.`)) {
      issues.push({
        code: "audio.id_locale_prefix",
        message: `${asset.id} must start with ${asset.locale}.`,
      });
    }

    if (!asset.text.trim()) {
      issues.push({
        code: "audio.empty_text",
        message: `${asset.id} must include fallback text`,
      });
    }

    if (!asset.path.startsWith(`/audio/${asset.locale}/`)) {
      issues.push({
        code: "audio.path_locale",
        message: `${asset.id} path must stay under /audio/${asset.locale}/`,
      });
    }
  }

  return issues;
}
