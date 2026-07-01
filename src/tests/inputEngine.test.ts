import { describe, expect, it } from "vitest";
import {
  displayKey,
  normalizePhysicalKey,
  normalizeTouchKey,
} from "../engine/inputEngine";

describe("input engine", () => {
  it("normalizes physical keyboard letters for Portuguese input", () => {
    expect(normalizePhysicalKey({ key: "C" })).toBe("c");
    expect(normalizePhysicalKey({ key: "Ç" })).toBe("ç");
    expect(normalizePhysicalKey({ key: "Á" })).toBe("á");
    expect(normalizePhysicalKey({ key: "Ã" })).toBe("ã");
    expect(normalizePhysicalKey({ key: "Ó" })).toBe("ó");
    expect(normalizePhysicalKey({ key: "Ô" })).toBe("ô");
  });

  it("ignores modifier shortcuts and non-character keys", () => {
    expect(normalizePhysicalKey({ key: "c", metaKey: true })).toBeNull();
    expect(normalizePhysicalKey({ key: "Shift" })).toBeNull();
  });

  it("normalizes on-screen keyboard labels", () => {
    expect(normalizeTouchKey("Ç")).toBe("ç");
    expect(normalizeTouchKey(" ")).toBe(" ");
    expect(normalizeTouchKey("backspace")).toBe("backspace");
    expect(normalizeTouchKey("Espaço")).toBeNull();
    expect(displayKey("ç")).toBe("Ç");
  });
});
