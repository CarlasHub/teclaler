import { describe, expect, it } from "vitest";
import { enGBStarterPack } from "../curriculum/enGBPack";
import { ptBRStarterPack } from "../curriculum/portuguesePacks";
import { ptPTYearOnePack } from "../curriculum/ptPTYearOnePack";
import {
  blendPhonics,
  canBlendPhonics,
  createPhonicsState,
  selectPhonicsPart,
} from "../engine/phonicsEngine";

describe("phonics practice sequence", () => {
  it("guides listening from the first syllable through blending", () => {
    const start = createPhonicsState();
    expect(canBlendPhonics(start, 2)).toBe(false);
    const early = selectPhonicsPart(start, 1, 2);
    expect(early.selection).toBe("ahead");
    expect(early.state).toEqual(start);

    const first = selectPhonicsPart(start, 0, 2);
    expect(first.selection).toBe("next");
    expect(first.state.nextPartIndex).toBe(1);
    expect(selectPhonicsPart(first.state, 0, 2).selection).toBe("replay");
    expect(canBlendPhonics(first.state, 2)).toBe(false);

    const second = selectPhonicsPart(first.state, 1, 2);
    expect(canBlendPhonics(second.state, 2)).toBe(true);
    expect(blendPhonics(second.state, 2).blended).toBe(true);
  });

  it("supports words with one recorded syllable", () => {
    const first = selectPhonicsPart(createPhonicsState(), 0, 1);
    expect(canBlendPhonics(first.state, 1)).toBe(true);
    expect(blendPhonics(first.state, 1).blended).toBe(true);
  });

  it("has recorded word parts and visible letter groups for every language's words", () => {
    for (const pack of [ptPTYearOnePack, ptBRStarterPack, enGBStarterPack]) {
      for (const item of pack.items) {
        expect(item.syllables?.length, item.id).toBeGreaterThan(0);
        expect(item.audio.syllables?.length, item.id).toBe(
          item.syllables?.length,
        );
        expect(item.audio.word, item.id).toBeTruthy();
        expect(item.graphemes?.length, item.id).toBeGreaterThan(0);
      }
    }
  });
});
