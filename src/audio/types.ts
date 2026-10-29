import type { LessonLocale } from "../curriculum/types";

export type AudioKind =
  "letter" | "partial" | "syllable" | "word" | "sentence" | "feedback";

export type AudioReviewStatus = "needs_review" | "approved";

export interface AudioManifestAsset {
  id: string;
  locale: LessonLocale;
  kind: AudioKind;
  text: string;
  path: string;
  voice?: string;
  reviewStatus: AudioReviewStatus;
  version?: string;
}

export interface AudioManifest {
  id: string;
  locale: LessonLocale;
  version: string;
  assets: AudioManifestAsset[];
}

export interface AudioPlaybackOptions {
  interrupt?: boolean;
  volume?: number;
}

export interface SpokenAudioMessage {
  text: string;
  locale?: LessonLocale;
}

export interface AudioService {
  play(audioId: string, options?: AudioPlaybackOptions): Promise<void>;
  preload(audioIds: string[]): Promise<void>;
  replayLast(): Promise<void>;
  stop?(): void;
  speak(
    message: SpokenAudioMessage,
    options?: AudioPlaybackOptions,
  ): Promise<void>;
}
