import { resolveAudioAsset } from "./audioManifest";
import { prepareDevelopmentTts, speakWithDevelopmentTts } from "./ttsFallback";
import { resolvePublicAssetPath } from "../platform/publicPath";
import type {
  AudioManifest,
  AudioManifestAsset,
  AudioPlaybackOptions,
  AudioService,
  SpokenAudioMessage,
} from "./types";

export interface BrowserAudioServiceOptions {
  onAudioAvailable?: () => void;
  onAudioUnavailable?: () => void;
}

export function createBrowserAudioService(
  manifest: AudioManifest,
  serviceOptions: BrowserAudioServiceOptions = {},
): AudioService {
  prepareDevelopmentTts();

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
      await reportIfUnavailable(
        speakWithDevelopmentTts(
          { text: audioId, locale: manifest.locale },
          { interrupt: options.interrupt, volume },
        ),
        serviceOptions,
      );
      return;
    }

    if (hasLocalAudioElementSupport()) {
      await reportIfUnavailable(
        playLocalAudio(asset.path, volume, (audio) => {
          currentAudio = audio;
        }).catch(() =>
          speakWithLocalSupportFallback(asset, {
            interrupt: options.interrupt,
            volume,
          }),
        ),
        serviceOptions,
      );
      return;
    }

    await reportIfUnavailable(
      speakWithDevelopmentTts(asset, {
        interrupt: options.interrupt,
        volume,
      }),
      serviceOptions,
    );
  }

  async function preload(audioIds: string[]): Promise<void> {
    if (!hasLocalAudioElementSupport()) {
      return;
    }

    for (const audioId of audioIds) {
      const asset = resolveAudioAsset(manifest, audioId);
      if (asset) {
        const audio = createLocalAudioElement(asset.path);
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
    const volume = normalizeVolume(options.volume);
    const locale = message.locale ?? manifest.locale;
    const localSpeechAsset = resolveLocalSpeechAsset(
      manifest,
      message.text,
      locale,
    );

    if (localSpeechAsset && hasLocalAudioElementSupport()) {
      await reportIfUnavailable(
        playLocalAudio(localSpeechAsset.path, volume, (audio) => {
          currentAudio = audio;
        }).catch(() =>
          speakWithLocalSupportFallback(localSpeechAsset, {
            interrupt: options.interrupt,
            volume,
          }),
        ),
        serviceOptions,
      );
      return;
    }

    await reportIfUnavailable(
      speakWithDevelopmentTts(
        { text: message.text, locale },
        {
          interrupt: options.interrupt,
          volume,
        },
      ),
      serviceOptions,
    );
  }

  return {
    play,
    preload,
    replayLast,
    speak,
  };
}

async function speakWithLocalSupportFallback(
  asset: AudioManifestAsset,
  options: { interrupt?: boolean; volume?: number },
): Promise<boolean> {
  return speakWithDevelopmentTts(asset, options);
}

async function playLocalAudio(
  path: string,
  volume: number,
  onAudioCreated: (audio: HTMLAudioElement) => void,
): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const audio = createLocalAudioElement(path);
    audio.volume = volume;
    onAudioCreated(audio);

    let settled = false;
    const finish = (success: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      if (success) {
        resolve(true);
      } else {
        reject(new Error(`Audio playback failed for ${path}`));
      }
    };

    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);

    try {
      const playback = audio.play();
      if (typeof playback?.catch === "function") {
        void playback.catch(() => finish(false));
      } else {
        finish(false);
      }
    } catch {
      finish(false);
    }
  });
}

function hasLocalAudioElementSupport(): boolean {
  if (typeof Audio !== "undefined") {
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  const audio = document.createElement("audio");
  return typeof audio.play === "function";
}

function createLocalAudioElement(path: string): HTMLAudioElement {
  const assetPath = resolvePublicAssetPath(path);

  if (typeof Audio !== "undefined") {
    return new Audio(assetPath);
  }

  const audio = document.createElement("audio");
  audio.src = assetPath;
  return audio;
}

function resolveLocalSpeechAsset(
  manifest: AudioManifest,
  text: string,
  locale: string,
): AudioManifestAsset | null {
  const normalizedText = text.trim();

  return (
    manifest.assets.find(
      (asset) =>
        asset.locale === locale &&
        asset.text === normalizedText &&
        (asset.kind === "feedback" || asset.kind === "partial"),
    ) ?? null
  );
}

async function reportIfUnavailable(
  playback: Promise<boolean>,
  serviceOptions: BrowserAudioServiceOptions,
): Promise<void> {
  const available = await playback;

  if (available) {
    serviceOptions.onAudioAvailable?.();
  } else {
    serviceOptions.onAudioUnavailable?.();
  }
}

function normalizeVolume(volume: number | undefined): number {
  if (typeof volume !== "number" || Number.isNaN(volume)) {
    return 1;
  }

  return Math.min(1, Math.max(0, volume));
}
