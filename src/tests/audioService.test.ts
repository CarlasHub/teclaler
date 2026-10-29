import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserAudioService } from "../audio/audioService";
import type { AudioManifest } from "../audio/types";

const manifest: AudioManifest = {
  id: "test-pt-PT",
  locale: "pt-PT",
  version: "1",
  assets: [
    {
      id: "pt-PT.word.casa",
      locale: "pt-PT",
      kind: "word",
      text: "casa",
      path: "/audio/pt-PT/words/casa.wav",
      voice: "Dii",
      reviewStatus: "needs_review",
    },
    {
      id: "pt-PT.word.mala",
      locale: "pt-PT",
      kind: "word",
      text: "mala",
      path: "/audio/pt-PT/words/mala.wav",
      voice: "Dii",
      reviewStatus: "needs_review",
    },
  ],
};

class FakeAudio {
  static instances: FakeAudio[] = [];
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onpause: (() => void) | null = null;
  volume = 1;
  preload = "none";
  constructor(public src: string) {
    FakeAudio.instances.push(this);
  }
  play() {
    return Promise.resolve();
  }
  pause() {
    this.onpause?.();
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  FakeAudio.instances = [];
});

describe("local audio playback", () => {
  it("stops an interrupted clip without leaving its promise pending", async () => {
    vi.stubGlobal("Audio", FakeAudio);
    const service = createBrowserAudioService(manifest);
    const first = service.play("pt-PT.word.casa").catch((error) => error);
    const second = service.play("pt-PT.word.mala", { interrupt: true });

    expect(await first).toMatchObject({ name: "AbortError" });
    expect(FakeAudio.instances).toHaveLength(2);
    FakeAudio.instances[1].onended?.();
    await expect(second).resolves.toBeUndefined();
  });

  it("stops the active clip through the public service API", async () => {
    vi.stubGlobal("Audio", FakeAudio);
    const service = createBrowserAudioService(manifest);
    const playback = service.play("pt-PT.word.casa").catch((error) => error);

    service.stop?.();

    expect(await playback).toMatchObject({ name: "AbortError" });
    expect(FakeAudio.instances[0]).toMatchObject({ currentTime: 0 });
  });

  it("reports a failed local clip when no speech fallback exists", async () => {
    class BrokenAudio extends FakeAudio {
      play() {
        return Promise.reject(new Error("device error"));
      }
    }
    vi.stubGlobal("Audio", BrokenAudio);
    const onAudioUnavailable = vi.fn();
    const service = createBrowserAudioService(manifest, {
      onAudioUnavailable,
    });

    await service.play("pt-PT.word.casa");
    expect(onAudioUnavailable).toHaveBeenCalledOnce();
  });
});
