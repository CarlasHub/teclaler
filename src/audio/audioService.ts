import { resolveAudioAsset } from "./audioManifest";
import { speakWithDevelopmentTts } from "./ttsFallback";
import type { AudioManifest, AudioService } from "./types";

export function createBrowserAudioService(
  manifest: AudioManifest,
): AudioService {
  let lastAudioId: string | null = null;
  let currentAudio: HTMLAudioElement | null = null;

  async function play(
    audioId: string,
    options?: { interrupt?: boolean },
  ): Promise<void> {
    const asset = resolveAudioAsset(manifest, audioId);
    lastAudioId = audioId;

    if (options?.interrupt) {
      currentAudio?.pause();
      currentAudio = null;
    }

    if (!asset) {
      await speakWithDevelopmentTts(
        { text: audioId, locale: manifest.locale },
        { interrupt: options?.interrupt },
      );
      return;
    }

    if (asset.reviewStatus !== "approved") {
      await speakWithDevelopmentTts(asset, { interrupt: options?.interrupt });
      return;
    }

    if (typeof Audio === "undefined") {
      await speakWithDevelopmentTts(asset, { interrupt: options?.interrupt });
      return;
    }

    await new Promise<void>((resolve) => {
      const audio = new Audio(asset.path);
      currentAudio = audio;
      audio.onended = () => resolve();
      audio.onerror = () => {
        void speakWithDevelopmentTts(asset, {
          interrupt: options?.interrupt,
        }).then(resolve);
      };

      void audio.play().catch(() => {
        void speakWithDevelopmentTts(asset, {
          interrupt: options?.interrupt,
        }).then(resolve);
      });
    });
  }

  async function preload(audioIds: string[]): Promise<void> {
    if (typeof Audio === "undefined") {
      return;
    }

    for (const audioId of audioIds) {
      const asset = resolveAudioAsset(manifest, audioId);
      if (asset?.reviewStatus === "approved") {
        const audio = new Audio(asset.path);
        audio.preload = "auto";
      }
    }
  }

  async function replayLast(): Promise<void> {
    if (lastAudioId) {
      await play(lastAudioId, { interrupt: true });
    }
  }

  return {
    play,
    preload,
    replayLast,
  };
}
