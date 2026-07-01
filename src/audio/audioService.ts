import { resolveAudioAsset } from "./audioManifest";
import { speakWithDevelopmentTts } from "./ttsFallback";
import type {
  AudioManifest,
  AudioPlaybackOptions,
  AudioService,
  SpokenAudioMessage,
} from "./types";

export function createBrowserAudioService(
  manifest: AudioManifest,
): AudioService {
  let lastAudioId: string | null = null;
  let currentAudio: HTMLAudioElement | null = null;

  async function play(
    audioId: string,
    options: AudioPlaybackOptions = {},
  ): Promise<void> {
    const asset = resolveAudioAsset(manifest, audioId);
    lastAudioId = audioId;
    const volume = normalizeVolume(options.volume);

    if (options.interrupt) {
      currentAudio?.pause();
      currentAudio = null;
    }

    if (!asset) {
      await speakWithDevelopmentTts(
        { text: audioId, locale: manifest.locale },
        { interrupt: options.interrupt, volume },
      );
      return;
    }

    if (asset.reviewStatus !== "approved") {
      await speakWithDevelopmentTts(asset, {
        interrupt: options.interrupt,
        volume,
      });
      return;
    }

    if (typeof Audio === "undefined") {
      await speakWithDevelopmentTts(asset, {
        interrupt: options.interrupt,
        volume,
      });
      return;
    }

    await new Promise<void>((resolve) => {
      const audio = new Audio(asset.path);
      audio.volume = volume;
      currentAudio = audio;
      audio.onended = () => resolve();
      audio.onerror = () => {
        void speakWithDevelopmentTts(asset, {
          interrupt: options.interrupt,
          volume,
        }).then(resolve);
      };

      void audio.play().catch(() => {
        void speakWithDevelopmentTts(asset, {
          interrupt: options.interrupt,
          volume,
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

  async function speak(
    message: SpokenAudioMessage,
    options: AudioPlaybackOptions = {},
  ): Promise<void> {
    await speakWithDevelopmentTts(
      { text: message.text, locale: message.locale ?? manifest.locale },
      {
        interrupt: options.interrupt,
        volume: normalizeVolume(options.volume),
      },
    );
  }

  return {
    play,
    preload,
    replayLast,
    speak,
  };
}

function normalizeVolume(volume: number | undefined): number {
  if (typeof volume !== "number" || Number.isNaN(volume)) {
    return 1;
  }

  return Math.min(1, Math.max(0, volume));
}
