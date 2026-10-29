import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "../app/App";
import type { AudioService } from "../audio/types";
import { ptPTStarterPack } from "../curriculum/ptPTPack";
import type { CurriculumItem, LessonLocale } from "../curriculum/types";
import type { LessonEvent } from "../engine/events";
import { displayKey } from "../engine/inputEngine";
import {
  createEmptyProgress,
  type ProgressSnapshot,
  type ProgressStore,
} from "../progress/progressStore";

const MALA_ID = "word-mala-pt-pt";

describe("word completion flow", () => {
  it("opens a clear home journey and lets the learner choose a stage", async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    render(
      <App
        audioService={createFakeAudioService()}
        progressStore={createMemoryProgressStore()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Vamos ler?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Começar a aprender" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Etapa 2 Sílabas simples/ }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Etapa 2 Sílabas simples/ }),
    );
    expect(screen.getByLabelText("Palavra alvo MESA")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Etapas" }));
    expect(
      screen.getByRole("heading", { name: "Escolhe uma etapa" }),
    ).toBeInTheDocument();
  });
  it("renders CASA with visible previous and next arrows", () => {
    renderApp(createFakeAudioService());

    expect(screen.getByLabelText("Palavra alvo CASA")).toBeInTheDocument();
    expect(screen.getByLabelText("Sílabas ca sa")).toBeInTheDocument();
    expect(screen.getByText("CA")).toBeInTheDocument();
    expect(screen.getByText("SA")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tecla C" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Tecla C" })).not.toHaveClass(
      "keyboard__key--pressed",
    );
    expect(
      screen.getByRole("button", { name: "Palavra anterior" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Palavra seguinte sem concluir esta",
      }),
    ).toBeEnabled();
  });

  it("lets the learner hear and restart a word without losing stage progress", async () => {
    const user = userEvent.setup();
    const audioService = createFakeAudioService();
    renderApp(audioService);

    expect(
      screen.getByText("Escreve a palavra, uma letra de cada vez."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ouvir palavra" }));
    expect(audioService.play).toHaveBeenCalledWith("pt-PT.word.casa", {
      interrupt: true,
      volume: 1,
    });

    fireEvent.keyDown(window, { key: "C" });
    expect(screen.getByLabelText("Letra 1 de 4, C")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Recomeçar palavra" }));
    expect(screen.getByLabelText("Letra 1 de 4, vazia")).toBeInTheDocument();
    expect(screen.getByTestId("learning-input-area")).toHaveFocus();
    expect(
      screen.getByText("Neste dispositivo: 0 conclusões"),
    ).toBeInTheDocument();
  });

  it("can try another word without marking an unfinished word complete", async () => {
    const user = userEvent.setup();
    renderApp(createFakeAudioService());
    fireEvent.keyDown(window, { key: "C" });

    await user.click(
      screen.getByRole("button", {
        name: "Palavra seguinte sem concluir esta",
      }),
    );
    expect(screen.getByLabelText("Palavra alvo MALA")).toBeInTheDocument();
    expect(screen.getByLabelText("Letra 1 de 4, vazia")).toBeInTheDocument();
    expect(
      screen.getByText("Neste dispositivo: 0 conclusões"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Palavra seguinte sem concluir esta",
      }),
    ).toBeEnabled();
  });

  it("focuses a visible completion action and advances with Enter", async () => {
    const user = userEvent.setup();
    renderApp(createFakeAudioService());

    for (const name of ["Tecla C", "Tecla A", "Tecla S", "Tecla A"]) {
      await user.click(screen.getByRole("button", { name }));
    }

    const next = screen.getByRole("button", { name: "Próxima palavra" });
    expect(next).toHaveFocus();
    expect(
      screen.queryByLabelText("Teclado português"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Muito bem!" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Neste dispositivo: 1 conclusão"),
    ).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Palavra alvo MALA")).toBeInTheDocument();
    expect(screen.getByText("Palavra 2 de 5: MALA.")).toBeInTheDocument();
  });

  it("resumes at the next unfinished word after returning home", async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    render(
      <App
        audioService={createFakeAudioService()}
        progressStore={createMemoryProgressStore()}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Começar a aprender" }),
    );
    for (const key of ["C", "A", "S", "A"]) {
      fireEvent.keyDown(window, { key });
    }
    await user.click(screen.getByRole("button", { name: "Etapas" }));
    expect(
      screen.getByRole("button", { name: "Continuar em MALA" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar em MALA" }));
    expect(screen.getByLabelText("Palavra alvo MALA")).toBeInTheDocument();
  });

  it("offers unfinished practice instead of false stage completion after skips", async () => {
    const user = userEvent.setup();
    renderApp(createFakeAudioService());
    for (let index = 0; index < 4; index++) {
      await user.click(
        screen.getByRole("button", {
          name: "Palavra seguinte sem concluir esta",
        }),
      );
    }
    expect(screen.getByLabelText("Palavra alvo BOLA")).toBeInTheDocument();
    for (const key of ["B", "O", "L", "A"]) {
      fireEvent.keyDown(window, { key });
    }

    expect(screen.queryByText("Lição completa")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Etapa concluída!" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Há mais palavras para praticar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ainda tens 4 palavras para praticar."),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Praticar palavra em falta" }),
    );
    expect(screen.getByLabelText("Palavra alvo CASA")).toBeInTheDocument();
  });

  it("renders MALA from curriculum data when selected", () => {
    renderApp(createFakeAudioService(), { initialItemId: MALA_ID });

    expect(screen.getByLabelText("Palavra alvo MALA")).toBeInTheDocument();
    expect(screen.getByLabelText("Lição atual")).not.toHaveClass(
      "lesson-stage--text-only",
    );
    expect(
      screen.getByRole("img", { name: "Uma mala simples." }),
    ).toHaveAttribute("src", "/images/bag-simple.svg");
    expect(screen.getByLabelText("Sílabas ma la")).toBeInTheDocument();
    expect(screen.getByText("MA")).toBeInTheDocument();
    expect(screen.getByText("LA")).toBeInTheDocument();
  });

  it("renders the responsive learning hierarchy without child-facing links", () => {
    renderApp(createFakeAudioService());

    expect(screen.getByTestId("learning-input-area")).toBeInTheDocument();
    expect(screen.getByLabelText("Lição atual")).toBeInTheDocument();
    expect(screen.getByLabelText("Palavra alvo CASA")).toBeInTheDocument();
    expect(screen.getByLabelText("Sílabas ca sa")).toBeInTheDocument();
    expect(screen.getByLabelText("Letras da palavra CASA")).toBeInTheDocument();
    expect(screen.getByLabelText("Progresso da lição")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Palavra anterior" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Teclado português")).toBeInTheDocument();
    expect(document.querySelectorAll("a")).toHaveLength(0);
  });

  it("offers local Portuguese variant settings and switches to pt-BR audio events", async () => {
    const user = userEvent.setup();
    const audioService = createFakeAudioService();

    renderApp(audioService);

    const languageSelect = screen.getByRole("combobox", {
      name: "Idioma da lição",
    });
    expect(languageSelect).toHaveValue("pt-PT");
    expect(languageSelect).toHaveAccessibleDescription(
      "Variante portuguesa Português europeu",
    );

    await user.selectOptions(languageSelect, "pt-BR");

    expect(languageSelect).toHaveValue("pt-BR");
    expect(languageSelect).toHaveAccessibleDescription(
      "Variante portuguesa Português do Brasil",
    );
    if (window.localStorage) {
      expect(window.localStorage.getItem("teclaler.lessonLocale")).toBe(
        "pt-BR",
      );
      expect(window.localStorage.getItem("teclaler.portugueseLocale")).toBe(
        null,
      );
    }

    await user.selectOptions(languageSelect, "pt-PT");

    const settingsButton = screen.getByRole("button", { name: "Definições" });
    expect(settingsButton).toHaveAttribute("aria-haspopup", "dialog");
    expect(settingsButton.querySelector("svg")).toBeInTheDocument();

    await user.click(settingsButton);

    const settingsDialog = screen.getByRole("dialog", { name: "Definições" });
    expect(settingsDialog).toBeInTheDocument();
    expect(document.activeElement).toBe(settingsDialog);

    expect(
      screen.getByRole("radio", { name: "Português europeu" }),
    ).toBeChecked();

    const ptBROption = screen.getByRole("radio", {
      name: "Português do Brasil",
    });
    await user.click(ptBROption);

    expect(ptBROption).toBeChecked();
    expect(languageSelect).toHaveAccessibleDescription(
      "Variante portuguesa Português do Brasil",
    );
    expect(languageSelect).toHaveValue("pt-BR");
    if (window.localStorage) {
      expect(window.localStorage.getItem("teclaler.lessonLocale")).toBe(
        "pt-BR",
      );
    }

    fireEvent.keyDown(settingsDialog, { key: "Escape" });

    expect(
      screen.queryByRole("dialog", { name: "Definições" }),
    ).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "C" });

    expect(screen.getByRole("button", { name: "Tecla C" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Tecla C" })).toHaveClass(
      "keyboard__key--pressed",
    );
    expect(audioService.play).toHaveBeenCalledWith("pt-BR.letter.c", {
      interrupt: true,
      volume: 1,
    });

    fireEvent.keyDown(window, { key: "L" });

    expect(audioService.speak).toHaveBeenCalledWith(
      { text: "Precisamos da letra A.", locale: "pt-BR" },
      { interrupt: true, volume: 1 },
    );
  });

  it("switches to the English starter lesson with English keyboard and audio events", async () => {
    const user = userEvent.setup();
    const audioService = createFakeAudioService();

    renderApp(audioService);

    const languageSelect = screen.getByRole("combobox", {
      name: "Idioma da lição",
    });
    await user.selectOptions(languageSelect, "en-GB");

    expect(languageSelect).toHaveValue("en-GB");
    if (window.localStorage) {
      expect(window.localStorage.getItem("teclaler.lessonLocale")).toBe(
        "en-GB",
      );
      expect(window.localStorage.getItem("teclaler.portugueseLocale")).toBe(
        null,
      );
    }
    expect(languageSelect).toHaveAccessibleDescription(
      "Lesson language British English",
    );
    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("lang", "en-GB"),
    );
    expect(document.title).toBe("TeclaLer - Listen. Read. Type.");
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "TeclaLer: Listen. Read. Type.",
    );
    expect(
      screen.getByRole("option", { name: "🇵🇹 European Portuguese" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "🇧🇷 Brazilian Portuguese" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "🇬🇧 British English" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Target word HOUSE")).toBeInTheDocument();
    expect(screen.getByLabelText("Word parts house")).toBeInTheDocument();
    expect(screen.getByLabelText("English keyboard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Key H" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Tecla Ç" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Key Ç" })).toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Next word without finishing this one",
      }),
    ).toBeEnabled();

    const settingsButton = screen.getByRole("button", { name: "Settings" });
    await user.click(settingsButton);
    expect(
      screen.getByRole("dialog", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "European Portuguese" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Brazilian Portuguese" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "British English" }),
    ).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.keyDown(window, { key: "H" });

    expect(screen.getByLabelText("Letter 1 of 5, H")).toBeInTheDocument();
    expect(audioService.play).toHaveBeenCalledWith("en-GB.letter.h", {
      interrupt: true,
      volume: 1,
    });

    const replayButton = screen.getByRole("button", {
      name: "Listen again",
    });
    expect(replayButton).toBeEnabled();
    expect(replayButton).toHaveAccessibleDescription("Will play H.");

    fireEvent.keyDown(window, { key: "A" });

    expect(screen.getByText("We need the letter O.")).toBeInTheDocument();
    expect(audioService.speak).toHaveBeenCalledWith(
      { text: "We need the letter O.", locale: "en-GB" },
      { interrupt: true, volume: 1 },
    );
    expect(screen.getByLabelText("Letter 2 of 5, empty")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Key A" })).toHaveClass(
      "keyboard__key--rejected",
    );

    for (const key of ["O", "U", "S", "E"]) {
      fireEvent.keyDown(window, { key });
    }

    await waitFor(() =>
      expect(screen.getByText("Word complete")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Next word" })).toBeEnabled();
    await waitFor(() =>
      expect(audioService.played).toContain("en-GB.word.house"),
    );
  });

  it("completes MALA with the physical keyboard and plays every key plus word audio", async () => {
    const audioService = createFakeAudioService();

    renderMalaApp(audioService);

    fireEvent.keyDown(window, { key: "M" });
    expect(screen.getByRole("button", { name: "Tecla M" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Tecla M" })).toHaveClass(
      "keyboard__key--pressed",
    );
    expect(audioService.play).toHaveBeenCalledWith("pt-PT.letter.m", {
      interrupt: true,
      volume: 1,
    });

    for (const key of ["A", "L", "A"]) {
      fireEvent.keyDown(window, { key });
    }

    await waitFor(() =>
      expect(screen.getByText("Palavra completa")).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Letra 4 de 4, A")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Próxima palavra" }),
    ).toBeEnabled();

    await waitFor(() =>
      expect(audioService.played).toContain("pt-PT.word.mala"),
    );
    expect(
      audioService.played.filter((id) => id === "pt-PT.letter.m"),
    ).toHaveLength(1);
    expect(
      audioService.played.filter((id) => id === "pt-PT.letter.a"),
    ).toHaveLength(2);
    expect(
      audioService.played.filter((id) => id === "pt-PT.letter.l"),
    ).toHaveLength(1);
  });

  it("ignores modifier and system keys, then accepts lowercase physical input", async () => {
    const audioService = createFakeAudioService();

    renderApp(audioService);

    for (const event of [
      { key: "Shift" },
      { key: "Control" },
      { key: "Alt" },
      { key: "Meta" },
      { key: "Tab" },
      { key: "Escape" },
      { key: "CapsLock" },
      { key: "ArrowLeft" },
      { key: "c", metaKey: true },
      { key: "c", ctrlKey: true },
      { key: "c", altKey: true },
    ]) {
      fireEvent.keyDown(window, event);
    }

    expect(screen.getByLabelText("Letra 1 de 4, vazia")).toBeInTheDocument();
    expect(screen.queryByText("Precisamos da letra C.")).toBeNull();

    fireEvent.keyDown(window, { key: "c" });

    expect(screen.getByLabelText("Letra 1 de 4, C")).toBeInTheDocument();
    await waitFor(() =>
      expect(audioService.played).toContain("pt-PT.letter.c"),
    );
  });

  it("completes MALA with the on-screen keyboard through the same input path", async () => {
    const user = userEvent.setup();
    const audioService = createFakeAudioService();

    renderMalaApp(audioService);

    for (const name of ["Tecla M", "Tecla A", "Tecla L", "Tecla A"]) {
      await user.click(screen.getByRole("button", { name }));
    }

    expect(screen.getByText("Palavra completa")).toBeInTheDocument();
    expect(
      screen.getByText("Neste dispositivo: 1 conclusão"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(audioService.played).toContain("pt-PT.word.mala"),
    );
  });

  it("keeps wrong-key feedback gentle and does not advance", () => {
    const audioService = createFakeAudioService();

    renderMalaApp(audioService);

    fireEvent.keyDown(window, { key: "L" });

    expect(screen.getByText("Precisamos da letra M.")).toBeInTheDocument();
    expect(audioService.speak).toHaveBeenCalledWith(
      { text: "Precisamos da letra M.", locale: "pt-PT" },
      { interrupt: true, volume: 1 },
    );
    expect(screen.getByLabelText("Letra 1 de 4, vazia")).toBeInTheDocument();
    const expectedKey = screen.getByRole("button", { name: "Tecla M" });
    const pressedWrongKey = screen.getByRole("button", { name: "Tecla L" });
    expect(expectedKey).toHaveAttribute("aria-pressed", "false");
    expect(expectedKey).not.toHaveClass("keyboard__key--pressed");
    expect(pressedWrongKey).toHaveAttribute("aria-pressed", "true");
    expect(pressedWrongKey).toHaveClass("keyboard__key--rejected");
    expect(
      screen.getByRole("button", {
        name: "Palavra seguinte sem concluir esta",
      }),
    ).toBeEnabled();
  });

  it("deletes with the Apagar button and allows the child to retype", async () => {
    const user = userEvent.setup();
    const audioService = createFakeAudioService();

    renderMalaApp(audioService);

    await user.click(screen.getByRole("button", { name: "Tecla M" }));
    await user.click(screen.getByRole("button", { name: "Tecla A" }));
    await user.click(screen.getByRole("button", { name: "Apagar" }));

    expect(screen.getByLabelText("Letra 1 de 4, M")).toBeInTheDocument();
    expect(screen.getByLabelText("Letra 2 de 4, vazia")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apagar" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Apagar" })).toHaveClass(
      "keyboard__key--pressed",
    );
    expect(screen.getByRole("button", { name: "Tecla A" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Tecla A" })).not.toHaveClass(
      "keyboard__key--pressed",
    );

    for (const name of ["Tecla A", "Tecla L", "Tecla A"]) {
      await user.click(screen.getByRole("button", { name }));
    }

    expect(screen.getByText("Palavra completa")).toBeInTheDocument();
    await waitFor(() =>
      expect(audioService.played).toContain("pt-PT.word.mala"),
    );
  });

  it("deletes with physical Backspace and rolls completion back to the current letter", async () => {
    const audioService = createFakeAudioService();

    renderMalaApp(audioService);

    for (const key of ["M", "A", "L", "A"]) {
      fireEvent.keyDown(window, { key });
    }

    await waitFor(() =>
      expect(screen.getByText("Palavra completa")).toBeInTheDocument(),
    );

    fireEvent.keyDown(window, { key: "Backspace" });

    expect(screen.queryByText("Palavra completa")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Letra 4 de 4, vazia")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apagar" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Apagar" })).toHaveClass(
      "keyboard__key--pressed",
    );
    expect(screen.getByRole("button", { name: "Tecla A" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Tecla A" })).not.toHaveClass(
      "keyboard__key--pressed",
    );
    expect(
      screen.getByRole("button", {
        name: "Palavra seguinte sem concluir esta",
      }),
    ).toBeEnabled();

    fireEvent.keyDown(window, { key: "A" });

    await waitFor(() =>
      expect(screen.getByText("Palavra completa")).toBeInTheDocument(),
    );
    expect(
      audioService.played.filter((id) => id === "pt-PT.word.mala"),
    ).toHaveLength(2);
  });

  it("replays the typed letter, syllable, partial text, or full word", async () => {
    const user = userEvent.setup();
    const audioService = createFakeAudioService();

    renderApp(audioService);

    const replayButton = screen.getByRole("button", {
      name: "Ouvir outra vez",
    });
    expect(replayButton).toBeDisabled();

    fireEvent.keyDown(window, { key: "C" });
    await waitFor(() =>
      expect(audioService.played).toContain("pt-PT.letter.c"),
    );
    expect(replayButton).toBeEnabled();
    expect(replayButton).toHaveAccessibleDescription("Vai ouvir C.");

    const letterReplayCount = audioService.played.filter(
      (id) => id === "pt-PT.letter.c",
    ).length;
    await user.click(replayButton);
    await waitFor(() =>
      expect(
        audioService.played.filter((id) => id === "pt-PT.letter.c"),
      ).toHaveLength(letterReplayCount + 1),
    );

    fireEvent.keyDown(window, { key: "A" });
    await waitFor(() =>
      expect(audioService.played).toContain("pt-PT.syllable.ca"),
    );
    expect(replayButton).toHaveAccessibleDescription("Vai ouvir CA.");

    const syllableReplayCount = audioService.played.filter(
      (id) => id === "pt-PT.syllable.ca",
    ).length;
    await user.click(replayButton);
    await waitFor(() =>
      expect(
        audioService.played.filter((id) => id === "pt-PT.syllable.ca"),
      ).toHaveLength(syllableReplayCount + 1),
    );

    fireEvent.keyDown(window, { key: "S" });
    await waitFor(() =>
      expect(audioService.played).toContain("pt-PT.letter.s"),
    );
    expect(replayButton).toHaveAccessibleDescription("Vai ouvir CAS.");

    await user.click(replayButton);
    await waitFor(() =>
      expect(audioService.speak).toHaveBeenCalledWith(
        { text: "cas", locale: "pt-PT" },
        { interrupt: true, volume: 1 },
      ),
    );

    fireEvent.keyDown(window, { key: "A" });
    await waitFor(() =>
      expect(audioService.played).toContain("pt-PT.word.casa"),
    );
    expect(replayButton).not.toBeInTheDocument();

    const wordReplayCount = audioService.played.filter(
      (id) => id === "pt-PT.word.casa",
    ).length;
    await user.click(
      screen.getByRole("button", { name: "Ouvir a palavra outra vez" }),
    );
    await waitFor(() =>
      expect(
        audioService.played.filter((id) => id === "pt-PT.word.casa"),
      ).toHaveLength(wordReplayCount + 1),
    );
    expect(audioService.replayed).toHaveLength(0);
  });

  it("provides a keyboard-accessible volume control that affects playback and spoken feedback", async () => {
    const audioService = createFakeAudioService();

    renderApp(audioService);

    const volumeControl = screen.getByLabelText("Volume do som");
    expect(volumeControl).toHaveAttribute("type", "range");
    expect(volumeControl).toHaveValue("1");

    fireEvent.change(volumeControl, { target: { value: "0.6" } });
    expect(volumeControl).toHaveValue("0.6");

    fireEvent.keyDown(window, { key: "C" });

    expect(audioService.play).toHaveBeenCalledWith("pt-PT.letter.c", {
      interrupt: true,
      volume: 0.6,
    });

    fireEvent.keyDown(window, { key: "L" });

    expect(audioService.speak).toHaveBeenCalledWith(
      { text: "Precisamos da letra A.", locale: "pt-PT" },
      { interrupt: true, volume: 0.6 },
    );
  });

  it("keeps controls keyboard accessible and restores lesson focus after navigation", async () => {
    const user = userEvent.setup();
    const audioService = createFakeAudioService();

    renderApp(audioService);

    const learningArea = screen.getByTestId("learning-input-area");
    expect(learningArea).toHaveAttribute("tabindex", "0");
    expect(document.activeElement).toBe(learningArea);

    const cKey = screen.getByRole("button", { name: "Tecla C" });
    cKey.focus();
    await user.keyboard("{Space}");
    expect(screen.getByLabelText("Letra 1 de 4, C")).toBeInTheDocument();
    expect(document.activeElement).toBe(cKey);

    fireEvent.keyDown(window, { key: "a" });
    expect(screen.getByLabelText("Letra 2 de 4, A")).toBeInTheDocument();
    await waitFor(() =>
      expect(audioService.played).toContain("pt-PT.syllable.ca"),
    );

    const replayButton = screen.getByRole("button", {
      name: "Ouvir outra vez",
    });
    replayButton.focus();
    const syllableReplayCount = audioService.played.filter(
      (id) => id === "pt-PT.syllable.ca",
    ).length;
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(replayButton);
    await waitFor(() =>
      expect(
        audioService.played.filter((id) => id === "pt-PT.syllable.ca"),
      ).toHaveLength(syllableReplayCount + 1),
    );

    for (const key of ["S", "A"]) {
      fireEvent.keyDown(window, { key });
    }

    await waitFor(() =>
      expect(screen.getByText("Palavra completa")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Próxima palavra" }));
    expect(screen.getByLabelText("Palavra alvo MALA")).toBeInTheDocument();
    expect(document.activeElement).toBe(learningArea);

    await user.click(screen.getByRole("button", { name: "Palavra anterior" }));
    expect(screen.getByLabelText("Palavra alvo CASA")).toBeInTheDocument();
    expect(document.activeElement).toBe(learningArea);
  });

  it("switches pt-PT stages from the keyboard and starts the selected word", async () => {
    const user = userEvent.setup();
    renderApp(createFakeAudioService());

    const stageSelect = screen.getByRole("combobox", {
      name: "Etapa de aprendizagem",
    });
    stageSelect.focus();
    await user.selectOptions(stageSelect, "2");

    expect(screen.getByLabelText("Palavra alvo MESA")).toBeInTheDocument();
    expect(screen.getByLabelText("Lição atual")).toHaveClass(
      "lesson-stage--text-only",
    );
    expect(document.activeElement).toBe(
      screen.getByTestId("learning-input-area"),
    );
    fireEvent.keyDown(window, { key: "m" });
    expect(screen.getByLabelText("Letra 1 de 4, M")).toBeInTheDocument();
  });

  it("resumes the selected stage and word on this device", async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    const firstVisit = render(
      <App audioService={createFakeAudioService()} initialView="lesson" />,
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Etapa de aprendizagem" }),
      "2",
    );
    for (const key of ["m", "e", "s", "a"]) {
      fireEvent.keyDown(window, { key });
    }
    await user.click(screen.getByRole("button", { name: "Próxima palavra" }));
    expect(screen.getByLabelText("Palavra alvo LATA")).toBeInTheDocument();
    firstVisit.unmount();

    render(
      <App audioService={createFakeAudioService()} initialView="lesson" />,
    );
    expect(
      screen.getByRole("combobox", { name: "Etapa de aprendizagem" }),
    ).toHaveValue("2");
    expect(screen.getByLabelText("Palavra alvo LATA")).toBeInTheDocument();
    window.localStorage.clear();
  });

  it("keeps typing behind settings paused and restores focus on Escape", async () => {
    const user = userEvent.setup();
    renderApp(createFakeAudioService());
    const settingsButton = screen.getByRole("button", { name: "Definições" });
    await user.click(settingsButton);
    const dialog = screen.getByRole("dialog", { name: "Definições" });
    expect(document.activeElement).toBe(dialog);
    fireEvent.keyDown(window, { key: "c" });
    expect(screen.getByLabelText("Letra 1 de 4, vazia")).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(
      Array.from(dialog.querySelectorAll("button, input, select")).at(-1),
    );
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(document.activeElement).toBe(settingsButton));
  });

  it("completes every starter word with the physical keyboard", async () => {
    const user = userEvent.setup();
    const audioService = createFakeAudioService();
    const expectedLetterAudioCount = ptPTStarterPack.items.reduce(
      (count, item) => count + item.targetSequence.length,
      0,
    );

    renderApp(audioService);

    for (const [index, item] of ptPTStarterPack.items.entries()) {
      expect(
        screen.getByLabelText(`Palavra alvo ${item.displayText}`),
      ).toBeInTheDocument();
      if (index < ptPTStarterPack.items.length - 1) {
        expect(
          screen.getByRole("button", {
            name: "Palavra seguinte sem concluir esta",
          }),
        ).toBeEnabled();
      } else {
        expect(
          screen.getByRole("button", {
            name: "Palavra seguinte sem concluir esta",
          }),
        ).toBeDisabled();
      }

      for (const key of item.targetSequence) {
        fireEvent.keyDown(window, {
          key: key.toLocaleUpperCase("pt-PT"),
        });
      }

      await waitFor(() =>
        expect(screen.getByText("Palavra completa")).toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(audioService.played).toContain(item.audio.word),
      );

      if (index < ptPTStarterPack.items.length - 1) {
        await user.click(
          screen.getByRole("button", { name: "Próxima palavra" }),
        );
      }
    }

    expect(
      audioService.played.filter((id) => id.includes(".letter.")),
    ).toHaveLength(expectedLetterAudioCount);
    expect(screen.getByText("Lição completa")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Próxima palavra" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Etapa concluída!" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Etapa seguinte" }));
    expect(screen.getByLabelText("Palavra alvo MESA")).toBeInTheDocument();
  });

  it("completes every starter word with the on-screen keyboard", async () => {
    const user = userEvent.setup();
    const audioService = createFakeAudioService();

    renderApp(audioService);

    for (const [index, item] of ptPTStarterPack.items.entries()) {
      for (const key of item.targetSequence) {
        await user.click(
          screen.getByRole("button", { name: `Tecla ${displayKey(key)}` }),
        );
      }

      expect(screen.getByText("Palavra completa")).toBeInTheDocument();
      await waitFor(() =>
        expect(audioService.played).toContain(item.audio.word),
      );

      if (index < ptPTStarterPack.items.length - 1) {
        await user.click(
          screen.getByRole("button", { name: "Próxima palavra" }),
        );
      }
    }

    expect(screen.getByText("Lição completa")).toBeInTheDocument();
  });

  it("keeps the arrows in place and allows moving back", async () => {
    const user = userEvent.setup();
    const audioService = createFakeAudioService();

    renderApp(audioService);

    expect(
      screen.getByRole("button", { name: "Palavra anterior" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Palavra seguinte sem concluir esta",
      }),
    ).toBeEnabled();

    for (const key of ["C", "A", "S", "A"]) {
      fireEvent.keyDown(window, { key });
    }

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Próxima palavra" }),
      ).toBeEnabled(),
    );

    await user.click(screen.getByRole("button", { name: "Próxima palavra" }));

    expect(screen.getByLabelText("Palavra alvo MALA")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Uma mala simples." }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Lição atual")).not.toHaveClass(
      "lesson-stage--text-only",
    );
    expect(
      screen.getByRole("button", { name: "Palavra anterior" }),
    ).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Palavra anterior" }));

    expect(screen.getByLabelText("Palavra alvo CASA")).toBeInTheDocument();
    expect(screen.getByLabelText("Letra 1 de 4, vazia")).toBeInTheDocument();
  });
});

function renderMalaApp(audioService: AudioService & { played: string[] }) {
  return renderApp(audioService, { initialItemId: MALA_ID });
}

interface RenderAppOptions {
  initialItemId?: string;
  initialLocale?: LessonLocale;
}

function renderApp(
  audioService: AudioService & { played: string[] },
  options: RenderAppOptions = {},
) {
  window.localStorage?.removeItem("teclaler.audioVolume");
  window.localStorage?.removeItem("teclaler.portugueseLocale");
  window.localStorage?.removeItem("teclaler.lessonLocale");

  return render(
    <App
      audioService={audioService}
      initialItemId={options.initialItemId}
      initialLocale={options.initialLocale}
      initialView="lesson"
      progressStore={createMemoryProgressStore()}
    />,
  );
}

function createFakeAudioService(): AudioService & {
  played: string[];
  replayed: string[];
  spoken: string[];
} {
  const played: string[] = [];
  const replayed: string[] = [];
  const spoken: string[] = [];

  return {
    played,
    replayed,
    spoken,
    play: vi.fn(async (audioId: string) => {
      played.push(audioId);
    }),
    preload: vi.fn(async () => undefined),
    replayLast: vi.fn(async () => {
      replayed.push("last");
    }),
    speak: vi.fn(async ({ text }: { text: string }) => {
      spoken.push(text);
    }),
  };
}

function createMemoryProgressStore(): ProgressStore {
  let snapshot = createEmptyProgress();

  return {
    load: () => snapshot,
    recordLessonEvents: (
      item: CurriculumItem,
      events: LessonEvent[],
    ): ProgressSnapshot => {
      const completed = events.some((event) => event.type === "WORD_COMPLETED");
      snapshot = {
        attempts: snapshot.attempts,
        completedItems: completed
          ? {
              ...snapshot.completedItems,
              [item.id]: (snapshot.completedItems[item.id] ?? 0) + 1,
            }
          : snapshot.completedItems,
      };
      return snapshot;
    },
    reset: () => {
      snapshot = createEmptyProgress();
      return snapshot;
    },
  };
}
