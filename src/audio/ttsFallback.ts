import type { AudioManifestAsset } from "./types";

export async function speakWithDevelopmentTts(
  asset: AudioManifestAsset | { text: string; locale?: string },
  options: { interrupt?: boolean } = {},
): Promise<void> {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return;
  }

  if (options.interrupt) {
    window.speechSynthesis.cancel();
  }

  await new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(asset.text);
    utterance.lang = asset.locale ?? "pt-PT";
    utterance.rate = 0.86;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}
