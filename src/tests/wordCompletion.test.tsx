import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "../app/App";
import type { AudioService } from "../audio/types";
import { ptPTStarterPack } from "../curriculum/ptPTPack";
import type { CurriculumItem } from "../curriculum/types";
import type { LessonEvent } from "../engine/events";
import { displayKey } from "../engine/inputEngine";
import {
  createEmptyProgress,
  type ProgressSnapshot,
  type ProgressStore,
} from "../progress/progressStore";

const MALA_ID = "word-mala-pt-pt";

describe("word completion flow", () => {
  it("renders CASA from curriculum data with syllables and disabled next action", () => {
    renderApp(createFakeAudioService());

    expect(screen.getByLabelText("Palavra alvo CASA")).toBeInTheDocument();
    expect(screen.getByLabelText("Sílabas ca sa")).toBeInTheDocument();
    expect(screen.getByText("CA")).toBeInTheDocument();
    expect(screen.getByText("SA")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tecla C" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Próxima palavra" }),
    ).toBeDisabled();
  });

  it("renders MALA from curriculum data when selected", () => {
    renderApp(createFakeAudioService(), MALA_ID);

    expect(screen.getByLabelText("Palavra alvo MALA")).toBeInTheDocument();
    expect(screen.getByLabelText("Sílabas ma la")).toBeInTheDocument();
    expect(screen.getByText("MA")).toBeInTheDocument();
    expect(screen.getByText("LA")).toBeInTheDocument();
  });

  it("completes MALA with the physical keyboard and plays every key plus word audio", async () => {
    const audioService = createFakeAudioService();

    renderMalaApp(audioService);

    for (const key of ["M", "A", "L", "A"]) {
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
    renderMalaApp(createFakeAudioService());

    fireEvent.keyDown(window, { key: "L" });

    expect(screen.getByText("Precisamos da letra M.")).toBeInTheDocument();
    expect(screen.getByLabelText("Letra 1 de 4, vazia")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tecla M" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Próxima palavra" }),
    ).toBeDisabled();
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
    expect(screen.getByRole("button", { name: "Tecla A" })).toHaveAttribute(
      "aria-pressed",
      "true",
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
    expect(screen.getByRole("button", { name: "Tecla A" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Próxima palavra" }),
    ).toBeDisabled();

    fireEvent.keyDown(window, { key: "A" });

    await waitFor(() =>
      expect(screen.getByText("Palavra completa")).toBeInTheDocument(),
    );
    expect(
      audioService.played.filter((id) => id === "pt-PT.word.mala"),
    ).toHaveLength(2);
  });

  it("replays the current full word audio instead of the last letter audio", async () => {
    const user = userEvent.setup();
    const audioService = createFakeAudioService();

    renderMalaApp(audioService);

    fireEvent.keyDown(window, { key: "M" });
    await waitFor(() =>
      expect(audioService.played).toContain("pt-PT.letter.m"),
    );

    await user.click(screen.getByRole("button", { name: "Ouvir outra vez" }));

    await waitFor(() =>
      expect(audioService.played.at(-1)).toBe("pt-PT.word.mala"),
    );
    expect(audioService.replayed).toHaveLength(0);
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
      expect(
        screen.getByRole("button", { name: "Próxima palavra" }),
      ).toBeDisabled();

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
      screen.getByRole("button", { name: "Próxima palavra" }),
    ).toBeDisabled();
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

  it("keeps next disabled until completion and allows moving back", async () => {
    const user = userEvent.setup();
    const audioService = createFakeAudioService();

    renderApp(audioService);

    expect(
      screen.getByRole("button", { name: "Próxima palavra" }),
    ).toBeDisabled();

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
    expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Anterior" }));

    expect(screen.getByLabelText("Palavra alvo CASA")).toBeInTheDocument();
    expect(screen.getByLabelText("Letra 1 de 4, vazia")).toBeInTheDocument();
  });
});

function renderMalaApp(audioService: AudioService & { played: string[] }) {
  return renderApp(audioService, MALA_ID);
}

function renderApp(
  audioService: AudioService & { played: string[] },
  initialItemId?: string,
) {
  return render(
    <App
      audioService={audioService}
      initialItemId={initialItemId}
      progressStore={createMemoryProgressStore()}
    />,
  );
}

function createFakeAudioService(): AudioService & {
  played: string[];
  replayed: string[];
} {
  const played: string[] = [];
  const replayed: string[] = [];

  return {
    played,
    replayed,
    play: vi.fn(async (audioId: string) => {
      played.push(audioId);
    }),
    preload: vi.fn(async () => undefined),
    replayLast: vi.fn(async () => {
      replayed.push("last");
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
