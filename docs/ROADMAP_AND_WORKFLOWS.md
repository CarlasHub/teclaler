# Roadmap and Workflows

## Build phases

### Phase 0: Governance and scaffold

- Create repo.
- Add this package.
- Create Vite/React/TypeScript app.
- Add tests and CI.

### Phase 1: Learning engine

- Curriculum types.
- Audio manifest types.
- Input normalisation.
- Lesson engine.
- Unit tests.

### Phase 2: UI

- Lesson screen.
- Typing boxes.
- Keyboard.
- Replay button.
- Responsive layout.

### Phase 3: Audio

- Manifest resolver.
- Audio service.
- TTS fallback for development.
- Preload/replay logic.

### Phase 4: Content

- Add starter words.
- Add syllables.
- Add graphemes.
- Add validator.
- Add review statuses.

### Phase 5: Progress

- Local progress.
- Mastery aggregation.
- Parent/teacher screen.
- Reset/export.

### Phase 6: PWA

- Manifest.
- Service worker.
- Offline audio/curriculum cache.

### Phase 7: Pilot

- QA.
- Accessibility review.
- Privacy review.
- Pedagogy review.
- Portuguese pronunciation review.

### Phase 8: Android

- TWA or Capacitor, by ADR.
- Internal test.
- Play Store prep.

### Phase 9: iOS

- Capacitor.
- TestFlight.
- App Store prep.

## Feature workflow

```text
idea → feature spec → risk review → ADR if needed → implementation → tests → review → release checklist
```

## Content workflow

```text
draft → pedagogy review → pronunciation review → audio review → validation → release
```

## Incident workflow

```text
stop release → classify → patch/remove → test → review obligations → update docs/tests → release fix
```
