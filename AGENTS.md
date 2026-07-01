# AGENTS.md: Project Instructions for Codex

This is the main instruction file for coding agents working on TeclaLer.

## Project identity

TeclaLer teaches children to read Portuguese while learning to type. The child sees the text, presses the matching key, hears that letter/sound in Portuguese, and hears the complete word when finished.

## Golden rule

Every feature must support this learning loop:

```text
see text → press key → hear Portuguese audio → complete syllable → complete word → hear word
```

## Hard product constraints

- The target word or sentence must always be visible in the lesson screen.
- The current letter/key must be visually highlighted.
- Physical keyboard and custom touch keyboard must both work.
- The child-facing UI must stay calm and low-distraction.
- No ads, social sharing, public leaderboards, or streak-pressure mechanics.
- No external links in child mode.
- No child accounts in MVP.
- No cloud storage in MVP.
- No recording child voice.
- No third-party analytics in MVP.

## Portuguese pedagogy constraints

- Treat Portuguese as Portuguese, not as English wearing a fake moustache.
- Model letters, graphemes, syllables, words, and sentences separately.
- Support `pt-PT` and `pt-BR` as explicit variants.
- Do not mix `pt-PT` and `pt-BR` audio in one released lesson.
- Production audio must be controlled through an audio manifest.
- Browser/device TTS is development fallback only.
- Curriculum items must include syllables, graphemes, target sequence, audio IDs, locale, difficulty, and review status.

## Engineering constraints

Recommended MVP stack:

```text
Vite
React
TypeScript
Vitest
Testing Library
Playwright
PWA/Workbox
IndexedDB via Dexie or localForage
```

Repository layout to create:

```text
src/
  app/
  components/
  engine/
  curriculum/
  audio/
  progress/
  platform/
  tests/
public/
  audio/
  images/
docs/
```

Architecture rules:

- Keep lesson engine framework-independent.
- Do not bury learning logic inside React click handlers.
- Use semantic lesson events: `KEY_ACCEPTED`, `KEY_REJECTED`, `SYLLABLE_COMPLETED`, `WORD_COMPLETED`.
- Add tests with behaviour changes.
- Add ADRs for architecture changes.
- Keep dependencies boring, small, and reviewed.

## Definition of done

A feature is done only when:

- Acceptance criteria are met.
- Tests are added or updated.
- Accessibility is considered.
- Child-safety constraints are checked.
- Privacy impact is checked.
- Docs are updated if behaviour, data shape, or architecture changed.
