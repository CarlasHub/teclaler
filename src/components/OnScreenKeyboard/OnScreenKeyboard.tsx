import { useRef, type CSSProperties, type Ref } from "react";
import {
  PORTUGUESE_ACCENT_KEYS,
  PORTUGUESE_KEYBOARD_ROWS,
  type KeyboardKey,
  displayKey,
  normalizeTouchKey,
} from "../../engine/inputEngine";
import type { LessonLocale } from "../../curriculum/types";

interface OnScreenKeyboardProps {
  locale?: LessonLocale;
  onKeyPress: (key: string) => void;
  pressedKey?: string | null;
  rejectedKey?: string | null;
  showAccentRow?: boolean;
  accentKeys?: readonly string[];
  completionAction?: {
    label: string;
    onClick: () => void;
    descriptionId: string;
    disabled?: boolean;
    buttonRef: Ref<HTMLButtonElement>;
    hearAgainLabel: string;
    onHearAgain: () => void;
    hearAgainShortLabel: string;
    restartLabel: string;
    onRestart: () => void;
    restartShortLabel: string;
  };
}

export function OnScreenKeyboard({
  locale = "pt-PT",
  onKeyPress,
  pressedKey = null,
  rejectedKey = null,
  showAccentRow = false,
  accentKeys,
  completionAction,
}: OnScreenKeyboardProps) {
  const touchHandledKeyRef = useRef<string | null>(null);
  const baseRows =
    locale === "en-GB" ? getEnglishKeyboardRows() : PORTUGUESE_KEYBOARD_ROWS;
  const visibleAccentKeys = accentKeys
    ? PORTUGUESE_ACCENT_KEYS.filter((key) => accentKeys.includes(key.value))
    : PORTUGUESE_ACCENT_KEYS;
  const rows = showAccentRow
    ? [...baseRows.slice(0, 3), visibleAccentKeys, baseRows[3]]
    : baseRows;

  return (
    <section
      className={`keyboard${completionAction ? " keyboard--complete" : ""}`}
      aria-label={locale === "en-GB" ? "English keyboard" : "Teclado português"}
    >
      {rows.map((row, rowIndex) => (
        <div
          className={`keyboard__row keyboard__row--${getRowKind(row)}`}
          key={rowIndex}
          style={{ "--key-count": row.length } as CSSProperties}
        >
          {completionAction && getRowKind(row) === "actions" ? (
            <>
              <button
                aria-describedby={completionAction.descriptionId}
                className="keyboard__continue"
                disabled={completionAction.disabled}
                onClick={completionAction.onClick}
                ref={completionAction.buttonRef}
                type="button"
              >
                {completionAction.label} <span aria-hidden="true">→</span>
              </button>
              <button
                aria-label={completionAction.hearAgainLabel}
                className="keyboard__support"
                onClick={completionAction.onHearAgain}
                type="button"
              >
                <span className="keyboard__support-long">
                  {completionAction.hearAgainLabel}
                </span>
                <span className="keyboard__support-short" aria-hidden="true">
                  {completionAction.hearAgainShortLabel}
                </span>
              </button>
              <button
                aria-label={completionAction.restartLabel}
                className="keyboard__support"
                onClick={completionAction.onRestart}
                type="button"
              >
                <span className="keyboard__support-long">
                  {completionAction.restartLabel}
                </span>
                <span className="keyboard__support-short" aria-hidden="true">
                  {completionAction.restartShortLabel}
                </span>
              </button>
            </>
          ) : (
            row.map((key) => {
              const isRejected = key.value === rejectedKey;
              const isPressed = !rejectedKey && key.value === pressedKey;
              const normalized = normalizeTouchKey(key.value);
              const ariaLabel =
                key.kind === "space" || key.kind === "backspace"
                  ? getActionLabel(locale, key.value, key.label)
                  : `${locale === "en-GB" ? "Key" : "Tecla"} ${displayKey(key.value)}`;
              const emitKey = () => {
                if (normalized) {
                  onKeyPress(normalized);
                }
              };

              return (
                <button
                  aria-label={ariaLabel}
                  aria-pressed={isPressed || isRejected}
                  className={`keyboard__key keyboard__key--${key.kind ?? "letter"}${isPressed ? " keyboard__key--pressed" : ""}${isRejected ? " keyboard__key--rejected" : ""}`}
                  draggable={false}
                  disabled={Boolean(completionAction)}
                  key={key.value}
                  onClick={() => {
                    if (touchHandledKeyRef.current === key.value) {
                      touchHandledKeyRef.current = null;
                      return;
                    }

                    emitKey();
                  }}
                  onKeyDown={(event) => {
                    if (isKeyboardActivationKey(event.key)) {
                      event.preventDefault();
                      emitKey();
                    }
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
                  {getActionLabel(locale, key.value, key.label)}
                </button>
              );
            })
          )}
        </div>
      ))}
    </section>
  );
}

function getRowKind(row: KeyboardKey[]): string {
  return row.some((key) => key.kind === "space" || key.kind === "backspace")
    ? "actions"
    : "letters";
}

function getEnglishKeyboardRows(): typeof PORTUGUESE_KEYBOARD_ROWS {
  return [
    PORTUGUESE_KEYBOARD_ROWS[0],
    PORTUGUESE_KEYBOARD_ROWS[1].filter((key) => key.value !== "ç"),
    PORTUGUESE_KEYBOARD_ROWS[2],
    PORTUGUESE_KEYBOARD_ROWS[3],
  ];
}

function getActionLabel(
  locale: LessonLocale,
  value: string,
  fallback: string,
): string {
  if (locale !== "en-GB") {
    return fallback;
  }

  if (value === " ") {
    return "Space";
  }

  if (value === "backspace") {
    return "Delete";
  }

  return fallback;
}

function isKeyboardActivationKey(key: string): boolean {
  return (
    key === "Enter" ||
    key === " " ||
    key === "Spacebar" ||
    key.toLocaleLowerCase("pt-PT") === "space"
  );
}
