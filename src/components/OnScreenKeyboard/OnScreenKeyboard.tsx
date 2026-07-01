import { useRef } from "react";
import {
  PORTUGUESE_ACCENT_KEYS,
  PORTUGUESE_KEYBOARD_ROWS,
  displayKey,
  normalizeTouchKey,
} from "../../engine/inputEngine";

interface OnScreenKeyboardProps {
  currentKey: string | null;
  onKeyPress: (key: string) => void;
  rejectedKey?: string | null;
  showAccentRow?: boolean;
}

export function OnScreenKeyboard({
  currentKey,
  onKeyPress,
  rejectedKey = null,
  showAccentRow = false,
}: OnScreenKeyboardProps) {
  const touchHandledKeyRef = useRef<string | null>(null);
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
            const isRejected = key.value === rejectedKey;
            const isCurrent = !rejectedKey && key.value === currentKey;
            const normalized = normalizeTouchKey(key.value);
            const ariaLabel =
              key.kind === "space" || key.kind === "backspace"
                ? key.label
                : `Tecla ${displayKey(key.value)}`;
            const emitKey = () => {
              if (normalized) {
                onKeyPress(normalized);
              }
            };

            return (
              <button
                aria-label={ariaLabel}
                aria-pressed={isCurrent || isRejected}
                className={`keyboard__key keyboard__key--${key.kind ?? "letter"}${isCurrent ? " keyboard__key--current" : ""}${isRejected ? " keyboard__key--rejected" : ""}`}
                draggable={false}
                key={key.value}
                onClick={() => {
                  if (touchHandledKeyRef.current === key.value) {
                    touchHandledKeyRef.current = null;
                    return;
                  }

                  emitKey();
                }}
                onPointerDown={(event) => {
                  if (
                    event.pointerType === "touch" ||
                    event.pointerType === "pen"
                  ) {
                    event.preventDefault();
                    touchHandledKeyRef.current = key.value;
                    emitKey();
                    return;
                  }

                  touchHandledKeyRef.current = null;
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
