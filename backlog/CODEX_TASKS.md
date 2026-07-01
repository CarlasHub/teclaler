# Codex Task Backlog

## Task 0.1: Scaffold app

Prompt:

```text
Read AGENTS.md and START_HERE_FOR_CODEX.md. Create a Vite + React + TypeScript app. Enable TypeScript strict mode. Add Vitest and Playwright placeholders. Create folder structure from docs/ARCHITECTURE.md. Do not implement product features yet.
```

## Task 1.1: Domain models

Prompt:

```text
Add TypeScript models for CurriculumItem, CurriculumPack, AudioManifest, LessonState, LessonEvent, AttemptEvent, and MasterySummary. Use docs/ARCHITECTURE.md and data/sample_curriculum_pt_PT.json.
```

## Task 1.2: Input engine

Prompt:

```text
Implement input normalisation for physical keyboard and on-screen keyboard. Support lowercase canonical values, uppercase display, ç, and accented characters. Add unit tests.
```

## Task 1.3: Lesson engine

Prompt:

```text
Implement pure TypeScript lesson engine. It must process canonical input, emit KEY_ACCEPTED, KEY_REJECTED, SYLLABLE_COMPLETED, WORD_COMPLETED, and never depend on React. Add tests for casa completion and wrong-key behaviour.
```

## Task 2.1: Lesson screen

Prompt:

```text
Build the lesson screen using docs/UX_UI_SPEC.md and assets/design/teclaler_app_interface_for_learning.png. Render target word, syllables, typing boxes, current audio cue, replay button, image area, and progress indicator.
```

## Task 2.2: Custom keyboard

Prompt:

```text
Build custom Portuguese on-screen keyboard with ç and optional accent row. Highlight current target key. Emit canonical key values. Add tests.
```

## Task 3.1: Audio manifest

Prompt:

```text
Implement audio manifest resolver and validation. Every release curriculum item must reference existing audio IDs. Add tests for missing IDs.
```

## Task 3.2: Audio service

Prompt:

```text
Implement AudioService with play, preload, replayLast. Production uses manifest files. Development may use Web Speech API fallback with warning. Add mocks/tests.
```

## Task 4.1: Starter curriculum

Prompt:

```text
Create pt-PT-mvp-001 curriculum with the 20 starter words from docs/PEDAGOGY_AND_CURRICULUM.md. Include syllables, graphemes, target sequence, audio IDs, and review status.
```

## Task 5.1: Local progress

Prompt:

```text
Implement local progress store using IndexedDB abstraction. Record attempts and aggregate mastery. Add reset and export functions.
```

## Task 6.1: PWA offline

Prompt:

```text
Add PWA manifest and service worker caching for app shell, curriculum, image, and audio assets. Add offline test instructions.
```

## Task 7.1: Release hardening

Prompt:

```text
Run through docs/RELEASE_GOVERNANCE.md and templates/DEFINITION_OF_DONE.md. Identify blockers. Add missing tests and docs for pilot readiness.
```
