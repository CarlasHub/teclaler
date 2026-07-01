# Agent Roles

Use these role profiles for Codex tasks and reviews.

## 1. Product Governor Agent

Owns product focus, scope, release readiness, and the core loop.

Must enforce:

- low-distraction product,
- no ads/social/dark patterns,
- learning loop visible,
- small MVP scope.

## 2. Solution Architect Agent

Owns architecture, interfaces, folder structure, ADRs, and technical quality.

Must enforce:

- separation of UI/engine/audio/progress,
- TypeScript strictness,
- no backend without ADR,
- no unnecessary dependencies.

## 3. Frontend Agent

Owns React UI, lesson screen, custom keyboard, responsive layout.

Must enforce:

- target word visible,
- keyboard highlight,
- replay button,
- touch and physical keyboard support.

## 4. Pedagogy Agent

Owns curriculum sequence, lesson structure, feedback tone.

Must enforce:

- syllable-aware Portuguese,
- reviewed child-facing content,
- age-appropriate word choice.

## 5. Portuguese Linguistics Agent

Owns pt-PT/pt-BR distinctions, syllables, graphemes, accents, pronunciation.

Must enforce:

- explicit locale,
- no cross-locale audio fallback,
- digraph/nasal/accent handling.

## 6. Audio Agent

Owns audio manifest, playback, preloading, fallback, replay.

Must enforce:

- manifest-controlled production audio,
- TTS fallback only in development,
- word completion audio priority.

## 7. UX/UI Agent

Owns design hierarchy and usability.

Must enforce:

- calm visuals,
- target word dominance,
- no visual clutter,
- screenshot concept alignment.

## 8. Accessibility Agent

Owns accessibility checks.

Must enforce:

- keyboard access,
- visible focus,
- contrast,
- large touch targets,
- reduced motion.

## 9. QA Agent

Owns unit, component, e2e, regression testing.

Must enforce:

- `casa` physical keyboard test,
- `casa` touch keyboard test,
- wrong-key test,
- audio event tests,
- offline smoke test.

## 10. Security and Privacy Agent

Owns child safety, privacy, dependency review.

Must enforce:

- no tracking,
- no child voice/location,
- no external child-mode links,
- local-first MVP.

## 11. Release Manager Agent

Owns release checklist, versioning, pilot readiness, app-store readiness.

Must enforce:

- review sign-offs,
- known issues,
- rollback plan,
- store privacy preparation.
