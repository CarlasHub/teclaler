import { expect, test } from "@playwright/test";

for (const lesson of [
  {
    locale: "pt-PT",
    start: "Começar a aprender",
    hear: "Ouvir palavra",
    file: "/audio/pt-PT/words/casa.wav",
  },
  {
    locale: "pt-BR",
    start: "Começar a aprender",
    hear: "Ouvir palavra",
    file: "/audio/pt-BR/words/casa.wav",
  },
  {
    locale: "en-GB",
    start: "Start learning",
    hear: "Hear the word",
    file: "/audio/en-GB/words/house.wav",
  },
] as const) {
  test(`${lesson.locale} local recording decodes and finishes in the browser`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const NativeAudio = window.Audio;
      const events: { src: string; ended: boolean; duration: number }[] = [];
      Reflect.set(window, "__teclalerAudioEvents", events);
      window.Audio = function (src?: string) {
        const audio = new NativeAudio(src);
        const record = { src: src ?? "", ended: false, duration: 0 };
        events.push(record);
        audio.addEventListener("ended", () => {
          record.ended = true;
          record.duration = audio.duration;
        });
        return audio;
      } as typeof Audio;
    });

    await page.goto("/");
    if (lesson.locale !== "pt-PT") {
      await page
        .getByRole("combobox", { name: "Idioma da lição" })
        .selectOption(lesson.locale);
    }
    await page.getByRole("button", { name: lesson.start }).click();
    await page.getByRole("button", { name: lesson.hear }).click();

    await expect
      .poll(
        () =>
          page.evaluate((file) => {
            const events = Reflect.get(window, "__teclalerAudioEvents") as {
              src: string;
              ended: boolean;
              duration: number;
            }[];
            return events.some(
              (event) =>
                event.src.endsWith(file) && event.ended && event.duration > 0.2,
            );
          }, lesson.file),
        { timeout: 10_000 },
      )
      .toBe(true);
  });
}
