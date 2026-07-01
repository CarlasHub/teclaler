import type { PortugueseLocale } from "../curriculum/types";

export type AudioKind =
  "letter" | "syllable" | "word" | "sentence" | "feedback";

export type AudioReviewStatus = "needs_review" | "approved";

export interface AudioManifestAsset {
  id: string;
  locale: PortugueseLocale;
  kind: AudioKind;
  text: string;
  path: string;
  voice?: string;
  reviewStatus: AudioReviewStatus;
  version?: string;
}

export interface AudioManifest {
  id: string;
  locale: PortugueseLocale;
  version: string;
  assets: AudioManifestAsset[];
}

export interface AudioPlaybackOptions {
  interrupt?: boolean;
  volume?: number;
}

export interface SpokenAudioMessage {
  text: string;
  locale?: PortugueseLocale;
}

export interface AudioService {
  play(audioId: string, options?: AudioPlaybackOptions): Promise<void>;
  preload(audioIds: string[]): Promise<void>;
  replayLast(): Promise<void>;
  speak(
    message: SpokenAudioMessage,
    options?: AudioPlaybackOptions,
  ): Promise<void>;
}
