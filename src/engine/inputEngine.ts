export type CanonicalInput = string;

export interface KeyboardEventLike {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

export interface KeyboardKey {
  label: string;
  value: CanonicalInput;
  kind?: "letter" | "accent" | "space" | "backspace";
}

const PORTUGUESE_CHARACTER_PATTERN = /^[a-záéíóúâêôãõàç]$/u;

export const PORTUGUESE_KEYBOARD_ROWS: KeyboardKey[][] = [
  "qwertyuiop".split("").map(toLetterKey),
  [
    ..."asdfghjkl".split("").map(toLetterKey),
    { label: "Ç", value: "ç", kind: "letter" },
  ],
  "zxcvbnm".split("").map(toLetterKey),
  [
    { label: "Espaço", value: " ", kind: "space" },
    { label: "Apagar", value: "backspace", kind: "backspace" },
  ],
];

export const PORTUGUESE_ACCENT_KEYS: KeyboardKey[] = [
  "á",
  "é",
  "í",
  "ó",
  "ú",
  "â",
  "ê",
  "ô",
  "ã",
  "õ",
].map((value) => ({
  label: value.toLocaleUpperCase("pt-PT"),
  value,
  kind: "accent",
}));

export const SUPPORTED_PORTUGUESE_KEY_VALUES = new Set(
  [...PORTUGUESE_KEYBOARD_ROWS.flat(), ...PORTUGUESE_ACCENT_KEYS]
    .map((key) => key.value)
    .filter((value) => value !== " " && value !== "backspace"),
);

export function containsAccentKey(sequence: string[]): boolean {
  const accentKeys = new Set(PORTUGUESE_ACCENT_KEYS.map((key) => key.value));
  return sequence.some((key) => accentKeys.has(normalizePortugueseText(key)));
}

export function normalizePhysicalKey(
  event: KeyboardEventLike,
): CanonicalInput | null {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return null;
  }

  return normalizeKeyValue(event.key);
}

export function normalizeTouchKey(value: string): CanonicalInput | null {
  return normalizeKeyValue(value);
}

export function displayKey(value: CanonicalInput | null | undefined): string {
  if (!value) {
    return "";
  }

  if (value === " ") {
    return "Espaço";
  }

  if (value === "backspace") {
    return "Apagar";
  }

  return value.toLocaleUpperCase("pt-PT");
}

export function normalizePortugueseText(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("pt-PT");
}

function normalizeKeyValue(value: string): CanonicalInput | null {
  if (
    value === " " ||
    value === "Spacebar" ||
    value.toLocaleLowerCase("pt-PT") === "space"
  ) {
    return " ";
  }

  if (
    value === "Backspace" ||
    value.toLocaleLowerCase("pt-PT") === "backspace"
  ) {
    return "backspace";
  }

  const normalized = normalizePortugueseText(value.trim());
  if (PORTUGUESE_CHARACTER_PATTERN.test(normalized)) {
    return normalized;
  }

  return null;
}

function toLetterKey(value: string): KeyboardKey {
  return {
    label: value.toLocaleUpperCase("pt-PT"),
    value,
    kind: "letter",
  };
}
