import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OnScreenKeyboard } from "../components/OnScreenKeyboard";

describe("on-screen Portuguese keyboard", () => {
  it("wires every base keyboard button including space and backspace", async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();

    render(<OnScreenKeyboard currentKey="m" onKeyPress={onKeyPress} />);

    const expectedButtons = [
      ["Tecla Q", "q"],
      ["Tecla W", "w"],
      ["Tecla E", "e"],
      ["Tecla R", "r"],
      ["Tecla T", "t"],
      ["Tecla Y", "y"],
      ["Tecla U", "u"],
      ["Tecla I", "i"],
      ["Tecla O", "o"],
      ["Tecla P", "p"],
      ["Tecla A", "a"],
      ["Tecla S", "s"],
      ["Tecla D", "d"],
      ["Tecla F", "f"],
      ["Tecla G", "g"],
      ["Tecla H", "h"],
      ["Tecla J", "j"],
      ["Tecla K", "k"],
      ["Tecla L", "l"],
      ["Tecla Ç", "ç"],
      ["Tecla Z", "z"],
      ["Tecla X", "x"],
      ["Tecla C", "c"],
      ["Tecla V", "v"],
      ["Tecla B", "b"],
      ["Tecla N", "n"],
      ["Tecla M", "m"],
      ["Espaço", " "],
      ["Apagar", "backspace"],
    ] as const;

    for (const [name] of expectedButtons) {
      await user.click(screen.getByRole("button", { name }));
    }

    expect(onKeyPress.mock.calls.map(([value]) => value)).toEqual(
      expectedButtons.map(([, value]) => value),
    );
  });

  it("emits canonical ç from the touch keyboard and highlights the current key", async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();

    render(<OnScreenKeyboard currentKey="ç" onKeyPress={onKeyPress} />);

    const cCedilha = screen.getByRole("button", { name: "Tecla Ç" });
    expect(cCedilha).toHaveAttribute("aria-pressed", "true");

    await user.click(cCedilha);

    expect(onKeyPress).toHaveBeenCalledWith("ç");
  });

  it("highlights the rejected key instead of the expected key during wrong-key feedback", () => {
    const onKeyPress = vi.fn();

    render(
      <OnScreenKeyboard
        currentKey="c"
        onKeyPress={onKeyPress}
        rejectedKey="m"
      />,
    );

    const cKey = screen.getByRole("button", { name: "Tecla C" });
    const mKey = screen.getByRole("button", { name: "Tecla M" });

    expect(cKey).toHaveAttribute("aria-pressed", "false");
    expect(cKey).not.toHaveClass("keyboard__key--current");
    expect(mKey).toHaveAttribute("aria-pressed", "true");
    expect(mKey).toHaveClass("keyboard__key--rejected");
  });

  it("keeps space and backspace keyboard accessible by role and name", () => {
    const onKeyPress = vi.fn();

    render(<OnScreenKeyboard currentKey={null} onKeyPress={onKeyPress} />);

    expect(screen.getByRole("button", { name: "Espaço" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Apagar" })).toBeEnabled();
  });

  it("does not duplicate touch input when a touch pointer is followed by click", () => {
    const onKeyPress = vi.fn();

    render(<OnScreenKeyboard currentKey="c" onKeyPress={onKeyPress} />);

    const cKey = screen.getByRole("button", { name: "Tecla C" });
    fireEvent.pointerDown(cKey, { pointerType: "touch" });
    fireEvent.click(cKey);

    expect(onKeyPress).toHaveBeenCalledTimes(1);
    expect(onKeyPress).toHaveBeenCalledWith("c");
  });

  it("shows accent keys only when the lesson needs them", async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    const { rerender } = render(
      <OnScreenKeyboard currentKey="ã" onKeyPress={onKeyPress} />,
    );

    expect(screen.queryByRole("button", { name: "Tecla Ã" })).toBeNull();

    rerender(
      <OnScreenKeyboard currentKey="ã" onKeyPress={onKeyPress} showAccentRow />,
    );

    const aTilde = screen.getByRole("button", { name: "Tecla Ã" });
    expect(aTilde).toHaveAttribute("aria-pressed", "true");

    await user.click(aTilde);

    expect(onKeyPress).toHaveBeenCalledWith("ã");
  });
});
