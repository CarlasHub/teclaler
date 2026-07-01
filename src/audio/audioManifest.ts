import type { AudioManifest, AudioManifestAsset } from "./types";

export function resolveAudioAsset(
  manifest: AudioManifest,
  audioId: string,
): AudioManifestAsset | null {
  return manifest.assets.find((asset) => asset.id === audioId) ?? null;
}

export function resolveAudioText(
  manifest: AudioManifest,
  audioId: string,
): string {
  return resolveAudioAsset(manifest, audioId)?.text ?? audioId;
}

export function collectManifestAudioIds(manifest: AudioManifest): Set<string> {
  return new Set(manifest.assets.map((asset) => asset.id));
}
