export type LessonEvent =
  | { type: "KEY_ACCEPTED"; char: string; audioId?: string }
  | { type: "KEY_REJECTED"; expected: string; actual: string }
  | { type: "SYLLABLE_COMPLETED"; syllable: string; audioId?: string }
  | { type: "WORD_COMPLETED"; itemId: string; audioId?: string };
