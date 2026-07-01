import type { AudioManifestAsset } from "./types";

const activeUtterances = new Set<SpeechSynthesisUtterance>();
const MIN_TTS_TIMEOUT_MS = 2600;
const TTS_TIMEOUT_MS_PER_CHARACTER = 92;
const FEMININE_PT_BR_VOICE_NAMES = [
  "luciana",
  "francisca",
  "maria",
  "helena",
  "heloisa",
  "heloísa",
  "vitoria",
  "vitória",
  "leticia",
  "letícia",
  "camila",
  "fernanda",
  "sandy",
  "shelley",
  "flo",
  "google português do brasil",
  "google portuguese brazil",
];

let cachedVoices: SpeechSynthesisVoice[] = [];

export function prepareDevelopmentTts(): void {
  if (!hasSpeechSynthesisSupport()) {
    return;
  }

  cacheSpeechVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cacheSpeechVoices();
  };
}

export async function speakWithDevelopmentTts(
  asset: AudioManifestAsset | { text: string; locale?: string },
  options: { interrupt?: boolean; volume?: number } = {},
): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const volume = normalizeVolume(options.volume);
  if (volume === 0) {
    return true;
  }

  if (!hasSpeechSynthesisSupport()) {
    return false;
  }

  if (options.interrupt) {
    cancelActiveSpeech();
  }

  const locale = asset.locale ?? "pt-PT";
  const voices = await loadSpeechVoices();
  const selectedVoice = selectPreferredVoice(
    voices,
    locale,
    "voice" in asset ? asset.voice : undefined,
  );

  if (!selectedVoice) {
    return false;
  }

  window.speechSynthesis.resume();

  const spoke = await new Promise<boolean>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(asset.text);
    utterance.lang = locale;
    utterance.voice = selectedVoice;
    utterance.rate = getSpeechRate(asset);
    utterance.pitch = getSpeechPitch(locale);
    utterance.volume = volume;
    activeUtterances.add(utterance);

    let timeout: number;
    const finish = (success: boolean) => {
      window.clearTimeout(timeout);
      activeUtterances.delete(utterance);
      resolve(success);
    };

    timeout = window.setTimeout(
      () => finish(true),
      getSpeechTimeoutMs(asset.text),
    );

    utterance.onend = () => finish(true);
    utterance.onerror = () => finish(false);
    window.speechSynthesis.speak(utterance);
  });

  return spoke;
}

export function selectPreferredVoice(
  voices: SpeechSynthesisVoice[],
  locale: string,
  voiceHint?: string,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) {
    return null;
  }

  const normalizedLocale = normalizeLocale(locale);
  const exactLocaleVoices = voices.filter(
    (voice) => normalizeLocale(voice.lang) === normalizedLocale,
  );

  if (exactLocaleVoices.length === 0) {
    return null;
  }

  if (voiceHint) {
    const normalizedHint = normalizeVoiceName(voiceHint);
    const hintedVoice = exactLocaleVoices.find((voice) =>
      normalizeVoiceName(voice.name).includes(normalizedHint),
    );
    if (hintedVoice) {
      return hintedVoice;
    }
  }

  if (normalizedLocale === "pt-br") {
    const feminineVoice = exactLocaleVoices.find((voice) =>
      FEMININE_PT_BR_VOICE_NAMES.some((voiceName) =>
        normalizeVoiceName(voice.name).includes(voiceName),
      ),
    );

    if (feminineVoice) {
      return feminineVoice;
    }
  }

  return exactLocaleVoices[0];
}

export function hasBrowserAudioOutputSupport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return hasSpeechSynthesisSupport() || hasLocalAudioElementSupport();
}

function hasSpeechSynthesisSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
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

function cancelActiveSpeech(): void {
  window.speechSynthesis.cancel();
  activeUtterances.clear();
}

function cacheSpeechVoices(): SpeechSynthesisVoice[] {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
  }

  return cachedVoices;
}

async function loadSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  const voices = cacheSpeechVoices();
  if (voices.length > 0) {
    return voices;
  }

  return new Promise((resolve) => {
    const previousHandler = window.speechSynthesis.onvoiceschanged;

    const finish = () => {
      window.clearTimeout(timeout);
      window.speechSynthesis.onvoiceschanged = previousHandler;
      resolve(cacheSpeechVoices());
    };

    const timeout = window.setTimeout(finish, 700);
    window.speechSynthesis.onvoiceschanged = (event) => {
      if (typeof previousHandler === "function") {
        previousHandler.call(window.speechSynthesis, event);
      }

      finish();
    };
  });
}

function getSpeechRate(
  asset: AudioManifestAsset | { text: string; locale?: string },
): number {
  if ("kind" in asset && asset.kind === "letter") {
    return 0.78;
  }

  return 0.84;
}

function getSpeechPitch(locale: string | undefined): number {
  return normalizeLocale(locale ?? "pt-PT") === "pt-br" ? 1.08 : 1.02;
}

function getSpeechTimeoutMs(text: string): number {
  return Math.max(
    MIN_TTS_TIMEOUT_MS,
    Math.min(9000, text.length * TTS_TIMEOUT_MS_PER_CHARACTER),
  );
}

function normalizeLocale(locale: string): string {
  return locale.replace("_", "-").toLocaleLowerCase("en-GB");
}

function normalizeVoiceName(name: string): string {
  return name.normalize("NFC").toLocaleLowerCase("pt-BR");
}

function normalizeVolume(volume: number | undefined): number {
  if (typeof volume !== "number" || Number.isNaN(volume)) {
    return 1;
  }

  return Math.min(1, Math.max(0, volume));
}
