import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserAudioService } from "../audio/audioService";
import {
  hasBrowserAudioOutputSupport,
  prepareDevelopmentTts,
  selectPreferredVoice,
  speakWithDevelopmentTts,
} from "../audio/ttsFallback";
import type { AudioManifest } from "../audio/types";

class FakeSpeechSynthesisUtterance {
  lang = "";
  pitch = 1;
  rate = 1;
  text: string;
  voice: SpeechSynthesisVoice | null = null;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe("development TTS fallback", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "Audio");
    Reflect.deleteProperty(window, "speechSynthesis");
    Reflect.deleteProperty(window, "SpeechSynthesisUtterance");
  });

  it("prefers a feminine Brazilian Portuguese voice when one is available", () => {
    const voices = [
      createVoice("Reed", "pt-BR"),
      createVoice("Luciana", "pt-BR"),
      createVoice("Joana", "pt-PT"),
    ];

    expect(selectPreferredVoice(voices, "pt-BR")?.name).toBe("Luciana");
  });

  it("does not replace Brazilian Portuguese with English or European Portuguese TTS", () => {
    const voices = [
      createVoice("Sandy", "en-GB"),
      createVoice("Joana", "pt-PT"),
    ];

    expect(selectPreferredVoice(voices, "pt-BR")).toBeNull();
  });

  it("honours an explicit manifest voice hint before locale defaults", () => {
    const voices = [
      createVoice("Luciana", "pt-BR"),
      createVoice("Sandy", "pt-BR"),
    ];

    expect(selectPreferredVoice(voices, "pt-BR", "Sandy")?.name).toBe("Sandy");
  });

  it("uses an exact en-GB voice hint before the preferred UK fallback", () => {
    const voices = [
      createVoice("Joana", "pt-PT"),
      createVoice("Shelley", "en-GB"),
      createVoice("Microsoft Hazel", "en-GB"),
    ];

    expect(selectPreferredVoice(voices, "en-GB", "Shelley")?.name).toBe(
      "Shelley",
    );
    expect(selectPreferredVoice(voices, "en-GB", "Luciana")?.name).toBe("Microsoft Hazel");
  });

  it("speaks pt-BR text without cancelling slow-starting speech", async () => {
    vi.useFakeTimers();
    const speech = installSpeechSynthesis([createVoice("Luciana", "pt-BR")]);

    const playback = speakWithDevelopmentTts(
      {
        id: "pt-BR.word.mala",
        kind: "word",
        locale: "pt-BR",
        path: "/audio/pt-BR/words/mala.wav",
        reviewStatus: "needs_review",
        text: "mala",
        voice: "Luciana",
      },
      { interrupt: true, volume: 0.85 },
    );
    await vi.advanceTimersByTimeAsync(0);

    expect(speech.cancel).toHaveBeenCalledTimes(1);
    expect(speech.speak).toHaveBeenCalledTimes(1);

    const utterance = speech.spoken[0];
    expect(utterance.lang).toBe("pt-BR");
    expect(utterance.text).toBe("mala");
    expect(utterance.voice?.name).toBe("Luciana");
    expect(utterance.volume).toBe(0.85);
    expect(utterance.rate).toBeLessThan(0.9);
    expect(utterance.pitch).toBeGreaterThan(1);

    await vi.advanceTimersByTimeAsync(900);
    expect(speech.cancel).toHaveBeenCalledTimes(1);

    utterance.onend?.();
    await expect(playback).resolves.toBe(true);
  });

  it("refuses to speak Brazilian Portuguese with an English default voice", async () => {
    const speech = installSpeechSynthesis([createVoice("Sandy", "en-GB")]);

    const playback = speakWithDevelopmentTts(
      {
        id: "pt-BR.word.mala",
        kind: "word",
        locale: "pt-BR",
        path: "/audio/pt-BR/words/mala.wav",
        reviewStatus: "needs_review",
        text: "mala",
        voice: "Luciana",
      },
      { interrupt: true, volume: 1 },
    );

    await expect(playback).resolves.toBe(false);
    expect(speech.speak).not.toHaveBeenCalled();
  });

  it("reports unavailable instead of using English TTS after local pt-BR audio fails", async () => {
    installFailingAudioElement();
    const speech = installSpeechSynthesis([createVoice("Sandy", "en-GB")]);
    const onAudioUnavailable = vi.fn();
    const service = createBrowserAudioService(createTestManifest("pt-BR"), {
      onAudioUnavailable,
    });

    await service.play("pt-BR.letter.c", { interrupt: true, volume: 1 });

    expect(speech.speak).not.toHaveBeenCalled();
    expect(onAudioUnavailable).toHaveBeenCalledTimes(1);
  });

  it("plays en-GB placeholder speech with the English voice hint", async () => {
    vi.useFakeTimers();
    const speech = installSpeechSynthesis([createVoice("Shelley", "en-GB")]);

    const playback = speakWithDevelopmentTts(
      {
        id: "en-GB.word.house",
        kind: "word",
        locale: "en-GB",
        path: "/audio/en-GB/words/house.wav",
        reviewStatus: "needs_review",
        text: "house",
        voice: "Shelley",
      },
      { interrupt: true, volume: 0.9 },
    );
    await vi.advanceTimersByTimeAsync(0);

    expect(speech.speak).toHaveBeenCalledTimes(1);

    const utterance = speech.spoken[0];
    expect(utterance.lang).toBe("en-GB");
    expect(utterance.text).toBe("house");
    expect(utterance.voice?.name).toBe("Shelley");
    expect(utterance.volume).toBe(0.9);

    utterance.onend?.();
    await expect(playback).resolves.toBe(true);
  });

  it("warms browser voices without playing audio", () => {
    const speech = installSpeechSynthesis([createVoice("Luciana", "pt-BR")]);

    prepareDevelopmentTts();

    expect(speech.getVoices).toHaveBeenCalled();
    expect(speech.speak).not.toHaveBeenCalled();
  });

  it("treats HTML audio element support as browser audio output support", () => {
    installAudioElementSupportOnly();

    expect(hasBrowserAudioOutputSupport()).toBe(true);
  });

  it("plays local placeholder audio before browser TTS for unreviewed assets", async () => {
    const audio = installAudioElement();
    const onAudioAvailable = vi.fn();
    const onAudioUnavailable = vi.fn();
    const service = createBrowserAudioService(createTestManifest(), {
      onAudioAvailable,
      onAudioUnavailable,
    });

    await service.play("pt-PT.letter.a", { interrupt: true, volume: 0.75 });

    expect(audio.created).toHaveLength(1);
    expect(audio.created[0].src).toBe("/audio/pt-PT/letters/a.wav");
    expect(audio.created[0].volume).toBe(0.75);
    expect(audio.created[0].play).toHaveBeenCalledTimes(1);
    expect(onAudioAvailable).toHaveBeenCalledTimes(1);
    expect(onAudioUnavailable).not.toHaveBeenCalled();
  });

  it("plays en-GB generated placeholder audio from the locale manifest path", async () => {
    const audio = installAudioElement();
    const onAudioAvailable = vi.fn();
    const service = createBrowserAudioService(createTestManifest("en-GB"), {
      onAudioAvailable,
    });

    await service.play("en-GB.letter.h", { interrupt: true, volume: 0.7 });

    expect(audio.created).toHaveLength(1);
    expect(audio.created[0].src).toBe("/audio/en-GB/letters/h.wav");
    expect(audio.created[0].volume).toBe(0.7);
    expect(audio.created[0].play).toHaveBeenCalledTimes(1);
    expect(onAudioAvailable).toHaveBeenCalledTimes(1);
  });

  it("plays local manifest speech for feedback messages before browser TTS", async () => {
    const audio = installAudioElement();
    const onAudioAvailable = vi.fn();
    const service = createBrowserAudioService(createTestManifest(), {
      onAudioAvailable,
    });

    await service.speak(
      { text: "Precisamos da letra A.", locale: "pt-PT" },
      { interrupt: true, volume: 0.8 },
    );

    expect(audio.created).toHaveLength(1);
    expect(audio.created[0].src).toBe(
      "/audio/pt-PT/feedback/precisamos-da-letra-a.wav",
    );
    expect(audio.created[0].volume).toBe(0.8);
    expect(audio.created[0].play).toHaveBeenCalledTimes(1);
    expect(onAudioAvailable).toHaveBeenCalledTimes(1);
  });

  it("reports unavailable voice instead of masking speech failure with tones", async () => {
    installNoLocalAudioElementSupport();
    const onAudioUnavailable = vi.fn();
    const service = createBrowserAudioService(createTestManifest(), {
      onAudioUnavailable,
    });

    await service.play("pt-PT.letter.a", { interrupt: true, volume: 1 });

    expect(onAudioUnavailable).toHaveBeenCalledTimes(1);
  });
});

function installSpeechSynthesis(voices: SpeechSynthesisVoice[]) {
  const spoken: FakeSpeechSynthesisUtterance[] = [];
  const speech = {
    cancel: vi.fn(),
    getVoices: vi.fn(() => voices),
    onvoiceschanged: null as (() => void) | null,
    resume: vi.fn(),
    speak: vi.fn((utterance: FakeSpeechSynthesisUtterance) => {
      spoken.push(utterance);
    }),
    spoken,
  };

  Object.defineProperty(window, "SpeechSynthesisUtterance", {
    configurable: true,
    value: FakeSpeechSynthesisUtterance,
  });
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: speech,
  });

  return speech;
}

function createVoice(name: string, lang: string): SpeechSynthesisVoice {
  return {
    default: false,
    lang,
    localService: true,
    name,
    voiceURI: name,
  };
}

function installAudioElement() {
  const created: FakeAudioElement[] = [];

  class FakeAudioElement {
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    pause = vi.fn();
    play = vi.fn(async () => {
      this.onended?.();
    });
    preload = "";
    src: string;
    volume = 1;

    constructor(src: string) {
      this.src = src;
      created.push(this);
    }
  }

  Object.defineProperty(window, "Audio", {
    configurable: true,
    value: FakeAudioElement,
  });

  return { created };
}

function installFailingAudioElement() {
  class FakeFailingAudioElement {
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    pause = vi.fn();
    play = vi.fn(async () => {
      this.onerror?.();
      throw new Error("Playback failed");
    });
    preload = "";
    src: string;
    volume = 1;

    constructor(src: string) {
      this.src = src;
    }
  }

  Object.defineProperty(window, "Audio", {
    configurable: true,
    value: FakeFailingAudioElement,
  });
}

function installAudioElementSupportOnly() {
  const originalCreateElement = document.createElement.bind(document);

  Reflect.deleteProperty(window, "Audio");
  vi.spyOn(document, "createElement").mockImplementation(((
    tagName: string,
    options?: ElementCreationOptions,
  ) => {
    if (tagName.toLocaleLowerCase() === "audio") {
      return { play: vi.fn() } as unknown as HTMLAudioElement;
    }

    return originalCreateElement(tagName, options);
  }) as typeof document.createElement);
}

function installNoLocalAudioElementSupport() {
  const originalCreateElement = document.createElement.bind(document);

  Reflect.deleteProperty(window, "Audio");
  vi.spyOn(document, "createElement").mockImplementation(((
    tagName: string,
    options?: ElementCreationOptions,
  ) => {
    if (tagName.toLocaleLowerCase() === "audio") {
      return {} as HTMLAudioElement;
    }

    return originalCreateElement(tagName, options);
  }) as typeof document.createElement);
}

function createTestManifest(
  locale: "pt-PT" | "pt-BR" | "en-GB" = "pt-PT",
): AudioManifest {
  if (locale === "pt-BR") {
    return {
      assets: [
        {
          id: "pt-BR.letter.c",
          kind: "letter",
          locale: "pt-BR",
          path: "/audio/pt-BR/letters/c.wav",
          reviewStatus: "needs_review",
          text: "cê",
          voice: "Luciana",
        },
      ],
      id: "pt-BR-test-audio",
      locale: "pt-BR",
      version: "test",
    };
  }

  if (locale === "en-GB") {
    return {
      assets: [
        {
          id: "en-GB.letter.h",
          kind: "letter",
          locale: "en-GB",
          path: "/audio/en-GB/letters/h.wav",
          reviewStatus: "needs_review",
          text: "aitch",
          voice: "Shelley",
        },
      ],
      id: "en-GB-test-audio",
      locale: "en-GB",
      version: "test",
    };
  }

  return {
    assets: [
      {
        id: "pt-PT.letter.a",
        kind: "letter",
        locale: "pt-PT",
        path: "/audio/pt-PT/letters/a.wav",
        reviewStatus: "needs_review",
        text: "a",
        voice: "Joana",
      },
      {
        id: "pt-PT.feedback.need-letter.a",
        kind: "feedback",
        locale: "pt-PT",
        path: "/audio/pt-PT/feedback/precisamos-da-letra-a.wav",
        reviewStatus: "needs_review",
        text: "Precisamos da letra A.",
        voice: "Joana",
      },
    ],
    id: "pt-PT-test-audio",
    locale: "pt-PT",
    version: "test",
  };
}
