export interface PhonicsState {
  nextPartIndex: number;
  blended: boolean;
}

export type PartSelection = "next" | "replay" | "ahead";

export function createPhonicsState(): PhonicsState {
  return { nextPartIndex: 0, blended: false };
}

export function selectPhonicsPart(
  state: PhonicsState,
  index: number,
  partCount: number,
): { state: PhonicsState; selection: PartSelection } {
  if (index < 0 || index >= partCount) {
    return { state, selection: "ahead" };
  }
  if (index < state.nextPartIndex) {
    return { state, selection: "replay" };
  }
  if (index > state.nextPartIndex) {
    return { state, selection: "ahead" };
  }
  return {
    state: { nextPartIndex: state.nextPartIndex + 1, blended: false },
    selection: "next",
  };
}

export function canBlendPhonics(
  state: PhonicsState,
  partCount: number,
): boolean {
  return partCount > 0 && state.nextPartIndex === partCount;
}

export function blendPhonics(
  state: PhonicsState,
  partCount: number,
): PhonicsState {
  return canBlendPhonics(state, partCount)
    ? { ...state, blended: true }
    : state;
}
