import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../app/App";
import type { AudioService } from "../audio/types";

function fakeAudio(): AudioService {
  return {
    play: vi.fn(async () => undefined),
    preload: vi.fn(async () => undefined),
    replayLast: vi.fn(async () => undefined),
    speak: vi.fn(async () => undefined),
  };
}

describe("dedicated phonics practice", () => {
  beforeEach(() => window.localStorage.clear());

  it("lets a child hear each syllable, blend CASA and open the same typing word", async () => {
    const user = userEvent.setup();
    const audio = fakeAudio();
    render(
      <App audioService={audio} initialLocale="pt-PT" initialView="home" />,
    );
    await user.click(screen.getByRole("button", { name: "Treinar sons" }));

    expect(
      screen.getByRole("heading", { name: "Treinar sons" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Palavra alvo CASA")).toBeInTheDocument();
    const blend = screen.getByRole("button", { name: "Juntar palavra" });
    expect(blend).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Ouvir sílaba 2: SA" }),
    );
    expect(blend).toBeDisabled();
    expect(audio.play).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Ouvir sílaba 1: CA" }),
    );
    expect(audio.play).toHaveBeenCalledWith("pt-PT.syllable.ca", {
      interrupt: true,
      volume: 1,
    });
    await user.click(
      screen.getByRole("button", { name: "Ouvir sílaba 2: SA" }),
    );
    expect(blend).toBeEnabled();
    await user.click(blend);
    await waitFor(() =>
      expect(
        screen.getByText("Juntaste a palavra. Agora podes escrevê-la!"),
      ).toBeInTheDocument(),
    );
    expect(audio.play).toHaveBeenCalledWith("pt-PT.word.casa", {
      interrupt: false,
      volume: 1,
    });
    await user.click(
      screen.getByRole("button", { name: /Agora escreve esta palavra/ }),
    );
    expect(screen.getByLabelText("Palavra alvo CASA")).toBeInTheDocument();
    expect(screen.getByLabelText("Teclado português")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "C" });
    expect(screen.getByLabelText("Letra 1 de 4, C")).toBeInTheDocument();
  });

  it("reaches an illustrated Stage 3 word and practises its own syllables", async () => {
    const user = userEvent.setup();
    const audio = fakeAudio();
    render(
      <App audioService={audio} initialLocale="pt-PT" initialView="home" />,
    );
    await user.click(screen.getByRole("button", { name: "Treinar sons" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Etapa" }),
      "3",
    );
    await user.click(
      screen.getByRole("button", { name: "Palavra seguinte de sons" }),
    );
    expect(screen.getByLabelText("Palavra alvo LEÃO")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Um leão." })).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Ouvir sílaba 1: LE" }),
    );
    expect(audio.play).toHaveBeenCalledWith("pt-PT.syllable.le", {
      interrupt: true,
      volume: 1,
    });
    await user.click(
      screen.getByRole("button", { name: "Ouvir sílaba 2: ÃO" }),
    );
    expect(audio.play).toHaveBeenCalledWith("pt-PT.syllable.ão", {
      interrupt: true,
      volume: 1,
    });
  });

  it("also opens English one-part practice with English recordings", async () => {
    const user = userEvent.setup();
    const audio = fakeAudio();
    render(
      <App audioService={audio} initialLocale="en-GB" initialView="home" />,
    );
    await user.click(screen.getByRole("button", { name: "Practise sounds" }));
    expect(screen.getByLabelText("Target word HOUSE")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Hear part 1: house" }),
    );
    expect(audio.play).toHaveBeenCalledWith("en-GB.syllable.house", {
      interrupt: true,
      volume: 1,
    });
    await user.click(screen.getByRole("button", { name: "Blend the word" }));
    await waitFor(() =>
      expect(
        screen.getByText("You put the word together. Try typing it!"),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Next phonics word" }));
    expect(screen.getByLabelText("Target word BAG")).toBeInTheDocument();
  });
});
