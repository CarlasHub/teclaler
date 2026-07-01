import type { AudioManifestAsset } from "./types";

const activeUtterances = new Set<SpeechSynthesisUtterance>();
const TTS_TIMEOUT_MS = 2500;
const TONE_DURATION_SECONDS = 0.16;

type AudioContextConstructor = typeof AudioContext;

export async function speakWithDevelopmentTts(
  asset: AudioManifestAsset | { text: string; locale?: string },
  options: { interrupt?: boolean; volume?: number } = {},
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const volume = normalizeVolume(options.volume);
  if (volume === 0) {
    return;
  }

  if (
    !("speechSynthesis" in window) ||
    !("SpeechSynthesisUtterance" in window)
  ) {
    await playDevelopmentTone(asset, volume);
    return;
  }

  if (options.interrupt) {
    window.speechSynthesis.cancel();
  }

  window.speechSynthesis.resume();

  await new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(asset.text);
    utterance.lang = asset.locale ?? "pt-PT";
    utterance.rate = 0.86;
    utterance.volume = volume;
    activeUtterances.add(utterance);

    let timeout: number;
    const finish = () => {
      window.clearTimeout(timeout);
      activeUtterances.delete(utterance);
      resolve();
    };
    timeout = window.setTimeout(finish, TTS_TIMEOUT_MS);

    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  });
}

async function playDevelopmentTone(
  asset: AudioManifestAsset | { text: string; locale?: string },
  volume: number,
): Promise<void> {
  const frequency = getFallbackFrequency(asset);
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) {
    await playHtmlAudioTone(frequency, volume);
    return;
  }

  try {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16 * volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + TONE_DURATION_SECONDS);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + TONE_DURATION_SECONDS);

    await new Promise<void>((resolve) => {
      oscillator.onended = () => {
        void context.close();
        resolve();
      };
    });
  } catch (_error) {
    await playHtmlAudioTone(frequency, volume);
  }
}

function getAudioContextClass(): AudioContextConstructor | null {
  if ("AudioContext" in window) {
    return window.AudioContext;
  }

  const prefixedWindow = window as Window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  return prefixedWindow.webkitAudioContext ?? null;
}

function getFallbackFrequency(
  asset: AudioManifestAsset | { text: string; locale?: string },
): number {
  if ("kind" in asset) {
    if (asset.kind === "word") {
      return 659;
    }

    if (asset.kind === "syllable") {
      return 587;
    }
  }

  return 523;
}

async function playHtmlAudioTone(
  frequency: number,
  volume: number,
): Promise<void> {
  if (!("Audio" in window)) {
    return;
  }

  const audio = new Audio(createToneWavDataUri(frequency, volume));
  audio.volume = volume;
  await new Promise<void>((resolve) => {
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    void audio.play().catch(() => resolve());
  });
}

function createToneWavDataUri(frequency: number, volume: number): string {
  const sampleRate = 8000;
  const sampleCount = Math.floor(sampleRate * TONE_DURATION_SECONDS);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const progress = index / sampleCount;
    const envelope = Math.sin(Math.PI * progress);
    const sample =
      Math.sin((2 * Math.PI * frequency * index) / sampleRate) *
      0.32 *
      volume *
      envelope;
    view.setInt16(44 + index * 2, sample * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return `data:audio/wav;base64,${window.btoa(binary)}`;
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function normalizeVolume(volume: number | undefined): number {
  if (typeof volume !== "number" || Number.isNaN(volume)) {
    return 1;
  }

  return Math.min(1, Math.max(0, volume));
}
