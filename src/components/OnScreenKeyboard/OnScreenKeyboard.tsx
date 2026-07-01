import {
  PORTUGUESE_ACCENT_KEYS,
  PORTUGUESE_KEYBOARD_ROWS,
  displayKey,
  normalizeTouchKey,
} from "../../engine/inputEngine";

interface OnScreenKeyboardProps {
  currentKey: string | null;
  onKeyPress: (key: string) => void;
  showAccentRow?: boolean;
}

export function OnScreenKeyboard({
  currentKey,
  onKeyPress,
  showAccentRow = false,
}: OnScreenKeyboardProps) {
  const rows = showAccentRow
    ? [
        ...PORTUGUESE_KEYBOARD_ROWS.slice(0, 3),
        PORTUGUESE_ACCENT_KEYS,
        PORTUGUESE_KEYBOARD_ROWS[3],
      ]
    : PORTUGUESE_KEYBOARD_ROWS;

  return (
    <section className="keyboard" aria-label="Teclado português">
      {rows.map((row, rowIndex) => (
        <div className="keyboard__row" key={rowIndex}>
          {row.map((key) => {
            const isCurrent = key.value === currentKey;
            const normalized = normalizeTouchKey(key.value);
            const ariaLabel =
              key.kind === "space" || key.kind === "backspace"
                ? key.label
                : `Tecla ${displayKey(key.value)}`;

            return (
              <button
                aria-label={ariaLabel}
                aria-pressed={isCurrent}
                className={`keyboard__key keyboard__key--${key.kind ?? "letter"}${isCurrent ? " keyboard__key--current" : ""}`}
                key={key.value}
                onClick={() => {
                  if (normalized) {
                    onKeyPress(normalized);
                  }
                }}
                type="button"
              >
                {key.label}
              </button>
            );
          })}
        </div>
      ))}
    </section>
  );
}
