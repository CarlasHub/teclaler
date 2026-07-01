# Start Here for Codex

You are working on **TeclaLer**, a Portuguese reading-and-typing app for children.

## Read before doing anything

1. `AGENTS.md`
2. `docs/ARCHITECTURE.md`
3. `docs/PRODUCT_REQUIREMENTS.md`
4. `docs/PEDAGOGY_AND_CURRICULUM.md`
5. `docs/PRIVACY_CHILD_SAFETY.md`
6. `backlog/CODEX_TASKS.md`

## First implementation sequence

Do not improvise a heroic new plan. Follow this sequence:

1. Create Vite + React + TypeScript scaffold.
2. Add TypeScript strict mode.
3. Add Vitest and Playwright.
4. Add domain models for curriculum, audio, lessons, progress.
5. Implement lesson engine with no UI.
6. Add tests for `casa` completion and wrong-key behaviour.
7. Build the lesson screen from the screenshot concept.
8. Add physical keyboard input.
9. Add custom Portuguese on-screen keyboard.
10. Add audio service with production manifest and development TTS fallback.
11. Add local progress storage.
12. Add PWA/offline support.
13. Add parent/teacher progress screen.
14. Run accessibility, privacy, curriculum, and audio release checks.

## Output expectation after each Codex task

Codex should report:

```text
Summary:
Files changed:
Tests added:
Tests run:
Product/pedagogy impact:
Privacy/safety impact:
Risks:
Next safe task:
```

## Stop conditions

Stop and ask for review before adding:

- Accounts.
- Cloud sync.
- Analytics.
- Payments.
- App-store SDKs.
- Audio recording.
- Third-party tracking.
- AI-generated child-facing lesson content.
