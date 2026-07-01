# TeclaLer Governance Package

**Project:** TeclaLer  
**Purpose:** Codex-ready governance, architecture, workflows, agents, skills, and implementation steps for a Portuguese reading-and-typing app for children.  
**Date:** 2026-07-01

## What this package is

This package is designed to be dropped into a new repository before implementation begins. It gives Codex and human contributors the project rules, architecture, product scope, child-safety requirements, curriculum rules, audio rules, and phased build plan.

## Core product loop

```text
Child sees text → child presses key → app reads key/sound in Portuguese → syllable completes → word completes → app reads full word
```

## Recommended build path

```text
Web app MVP → PWA/offline → Android wrapper → iOS wrapper
```

## Start here

1. Read `START_HERE_FOR_CODEX.md`.
2. Read `AGENTS.md`.
3. Read `docs/ARCHITECTURE.md`.
4. Read `backlog/CODEX_TASKS.md`.
5. Use the concept image at `assets/design/teclaler_app_interface_for_learning.png`.

## Included

```text
AGENTS.md
START_HERE_FOR_CODEX.md
TECLALER_FULL_GOVERNANCE_PACKAGE.md
docs/
agents/
skills/
workflows/
backlog/
templates/
data/
design/
assets/design/
references/
```

## Design concept

![TeclaLer app interface concept](assets/design/teclaler_app_interface_for_learning.png)

## Non-negotiables

- No ads.
- No social features.
- No public leaderboards.
- No external links in child mode.
- No unnecessary child data.
- No voice recording of children.
- No production reliance on uncontrolled device text-to-speech.
- Portuguese language content must be variant-aware and reviewed.
- The child must always see the target text.

## Initial web app foundation

The first working app scaffold is a Vite + React + TypeScript application for the TeclaLer learning loop. It loads content-driven starter lessons, supports physical keyboard input and the custom on-screen keyboard, routes audio through replaceable manifest-backed audio services, and stores only local progress and settings state in the browser.

The lesson screen includes local `Definições` / `Settings` with flag choices backed by explicit `pt-PT`, `pt-BR`, and `en-GB` lesson variants. The Portuguese starter words are `CASA`, `MALA`, `PATO`, `SAPO`, `BOLA`. The British English starter words are `HOUSE`, `BAG`, `DUCK`, `TOAD`, `BALL`. Each variant uses separate curriculum and audio IDs, so reviewed recordings can replace placeholders without mixing languages or accents.

Starter lesson content lives in `src/curriculum/starterLesson.ts`. The React app consumes generated `CurriculumItem` objects from `src/curriculum/ptPTPack.ts`, so word text, syllables, expected keys, audio event IDs, and local image assets stay out of UI components.

Reviewed production audio files are not included yet. The repo includes local placeholder voice files under `public/audio/` so letters, word parts, words, replay, and feedback stay audible during development without network access. The current placeholders use Joana for `pt-PT`, Luciana for `pt-BR`, and Shelley for `en-GB`. If a local file is missing or cannot play, the audio adapter falls back to exact-locale browser speech synthesis only. Production release must replace placeholder audio with approved manifest audio by updating `src/audio/manifest.ts` paths and review statuses.

### Run locally

```bash
npm install
npm run dev
```

### Test

```bash
npm test
```

The current tests cover the pure lesson engine, keyboard normalization, Portuguese and English on-screen keyboard emission, curriculum/audio validation, structured starter lesson validation, every Portuguese starter word through physical-keyboard-style input, and full lesson completion through both physical and on-screen keyboard input.

The lesson screen includes a local `Som` volume control. It defaults to full volume, affects letter, syllable, word, replay, and spoken feedback audio, and stores only the selected level in the browser.

### Validate Content

```bash
npm run validate:content
```

This checks the local starter lesson, generated curriculum packs, and placeholder audio manifests outside the test suite. It fails for missing audio IDs, missing local audio files, duplicate lesson/word/audio IDs, target/display text mismatches, malformed starter lesson fields, missing local image files or metadata, syllable or grapheme mismatches, and unsupported lesson keyboard characters.

To simulate release-mode audio checks without publishing anything:

```bash
npm run validate:content -- --release
```

That release-mode check is expected to fail while placeholder audio remains marked `needs_review`.

### Build

```bash
npm run build
```

The app includes a web app manifest and a simple production service worker registration path. Full Workbox/offline hardening remains a later PWA task.

### Test on an iPad

1. Start the dev server on the computer:

```bash
npm run dev
```

2. Make sure the iPad is on the same local network.
3. Open the Network URL shown by Vite on the iPad, for example `http://192.168.x.x:5173/`.
4. Tap once anywhere on the lesson screen if the browser has not focused the page yet.
5. Type the visible word using the iPad hardware keyboard or tap the on-screen TeclaLer keyboard.
6. Use `Próxima palavra` / `Next word` to move through the selected starter words.
7. After completing a word, pressing `Enter` on a hardware keyboard advances to the next word.

The iPad test should confirm that the target word stays visible, the current typing position is clear, keyboard keys highlight only after the child interacts, wrong keys do not advance, `Ouvir outra vez` remains available, and no account, analytics, ads, external links, cloud sync, or microphone permission appears.

### Hardware Test Plan

Use `docs/testing/HARDWARE_TEST_PLAN.md` for manual device checks across desktop physical keyboard, Android Chrome touch, iPad Safari touch, iPad Safari with a physical keyboard, and iPhone Safari when practical. This is a device-readiness checklist, not a release or publishing plan.
