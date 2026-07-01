# TeclaLer Full Governance Package

## 1. Executive summary

TeclaLer is a low-distraction Portuguese literacy app where children learn to read and type at the same time. The core mechanism is intentionally simple:

```text
The child sees the target text.
The child presses each key.
The app reads each key or sound in Portuguese.
The app reads each syllable where pedagogically useful.
The app reads the full word when completed.
```

The product should first be built as a web app designed as a PWA, then packaged for Android and iOS after the learning loop has been validated.

## 2. Product vision

TeclaLer turns the keyboard into a literacy tool. It connects visual text, motor action, and audio reinforcement.

The child should not have to guess what is happening. The screen should show:

- the word,
- the syllables,
- the typed letters,
- the current typing position, without pre-highlighting the expected keyboard key,
- the audio cue,
- the replay button,
- the Portuguese keyboard.

## 3. Product principles

### 3.1 Pedagogy before decoration

Every visual and sound must serve reading, typing, attention, feedback, or progress. No random reward animations. No cartoon circus. The world has enough noise.

### 3.2 Portuguese-first

Portuguese content must handle:

```text
vowels: a e i o u
accented vowels: á é í ó ú â ê ô ã õ à
ç
digraphs: ch lh nh rr ss qu gu
nasal forms: ão ã õ am em im om um
syllable structure
pt-PT and pt-BR variant differences
```

### 3.3 Safe by default

The app is for children. Therefore:

- no ads,
- no tracking SDKs,
- no social features,
- no external links in child mode,
- no child account requirement in MVP,
- no child voice recording,
- no manipulative engagement mechanics.

### 3.4 Local-first MVP

Progress should be local in the MVP. Add cloud only after validation and privacy review.

## 4. MVP scope

### Must have

- Lesson screen with target text always visible.
- Large word display.
- Syllable display.
- Typing boxes.
- Custom Portuguese on-screen keyboard.
- Physical keyboard support.
- Letter/key audio.
- Syllable audio.
- Completed-word audio.
- Replay audio button.
- 20 starter Portuguese words.
- Local progress tracking.
- Parent/teacher progress view.
- PWA/offline-ready architecture.

### Should have

- `pt-PT`/`pt-BR` data model.
- Audio speed setting.
- Uppercase/lowercase display toggle.
- Reduced motion.
- Curriculum validator.
- Audio manifest validator.

### Not in MVP

- Accounts.
- Cloud sync.
- Payments.
- Classroom admin.
- Public leaderboards.
- Social sharing.
- Third-party analytics.
- Speech recording.
- App store wrappers, until web/PWA has been tested.

## 5. Architecture overview

Use a layered architecture:

```text
Presentation UI
Input engine
Lesson engine
Curriculum repository
Audio service
Progress store
Platform/PWA layer
```

### 5.1 Input engine

Normalises physical and touch keyboard events.

Examples:

```text
KeyboardEvent.key = "C" → "c"
KeyboardEvent.key = "ç" → "ç"
Tap on on-screen "A" → "a"
```

### 5.2 Lesson engine

The lesson engine owns learning state. It must be UI-independent.

Events:

```ts
type LessonEvent =
  | { type: "KEY_ACCEPTED"; char: string; audioId: string }
  | { type: "KEY_REJECTED"; expected: string; actual: string }
  | { type: "SYLLABLE_COMPLETED"; syllable: string; audioId: string }
  | { type: "WORD_COMPLETED"; wordId: string; audioId: string };
```

### 5.3 Audio service

The audio service resolves audio IDs through a manifest.

Production:

```text
audioId → manifest → audio file → play
```

Development fallback:

```text
missing audioId → Web Speech API fallback → warning
```

### 5.4 Progress service

Stores local learning events and aggregates mastery.

Allowed MVP data:

- lesson ID,
- item ID,
- expected grapheme,
- actual grapheme,
- correct/incorrect,
- completion timestamp,
- optional local nickname.

Avoid:

- full names,
- dates of birth,
- emails,
- voice recordings,
- exact location,
- advertising IDs.

## 6. Recommended repository structure

```text
/
├── AGENTS.md
├── START_HERE_FOR_CODEX.md
├── docs/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── LessonScreen/
│   │   ├── OnScreenKeyboard/
│   │   └── ProgressSummary/
│   ├── engine/
│   │   ├── lessonEngine.ts
│   │   ├── inputEngine.ts
│   │   └── events.ts
│   ├── curriculum/
│   │   ├── schema.ts
│   │   ├── validators.ts
│   │   └── packs/
│   ├── audio/
│   │   ├── audioService.ts
│   │   ├── audioManifest.ts
│   │   └── ttsFallback.ts
│   ├── progress/
│   └── platform/
├── public/
│   ├── audio/
│   └── images/
├── e2e/
└── scripts/
```

## 7. Curriculum governance

Every curriculum item must include:

```json
{
  "id": "word-casa-pt-pt",
  "type": "word",
  "locale": "pt-PT",
  "text": "casa",
  "displayText": "CASA",
  "syllables": ["ca", "sa"],
  "graphemes": ["c", "a", "s", "a"],
  "targetSequence": ["c", "a", "s", "a"],
  "audio": {
    "letters": ["pt-PT.letter.c", "pt-PT.letter.a", "pt-PT.letter.s", "pt-PT.letter.a"],
    "syllables": ["pt-PT.syllable.ca", "pt-PT.syllable.sa"],
    "word": "pt-PT.word.casa"
  },
  "imageId": "image.house.simple",
  "difficulty": 1,
  "status": "draft"
}
```

Statuses:

```text
draft
pedagogy_review
pronunciation_review
ready_for_dev
ready_for_release
released
retired
```

No child-facing content ships from `draft`.

## 8. MVP starter words

```text
casa
mala
pato
sapo
bola
lua
mesa
lata
pipa
mimo
mãe
pai
pão
avó
avô
menina
menino
chave
filho
galinha
```

## 9. Audio governance

Production audio must be reviewed, versioned, and declared in an audio manifest.

Audio types:

```text
letter
syllable
word
sentence
feedback
```

Audio priority:

1. word completion,
2. syllable completion,
3. letter/key audio,
4. feedback prompt.

No cross-locale fallback in production. If `pt-PT.word.casa` is missing, do not silently use `pt-BR.word.casa`.

## 10. UX governance

The lesson screen must show:

- app name,
- target word,
- syllables,
- image where useful,
- typing boxes,
- current audio cue,
- replay button,
- Portuguese keyboard,
- progress indicator.

The concept image is located at:

```text
assets/design/teclaler_app_interface_for_learning.png
```

Implementation should preserve learning hierarchy, not necessarily pixel-perfect details.

## 11. Child privacy and safety

MVP privacy model:

```text
local-first
no account
no cloud sync
no third-party analytics
no ads
no child full name required
```

Legal note: this package is not legal advice. For Portugal/EU launches, review GDPR and Portuguese Law No. 58/2019. For UK launches, review the ICO Children's Code. For US launches, review COPPA. Humanity has made childhood, education, and compliance three separate departments, so legal review is not optional before public launch.

## 12. Accessibility governance

Target WCAG 2.2 AA where applicable.

Requirements:

- large text,
- high contrast,
- no colour-only meaning,
- visible focus,
- keyboard operation,
- large touch targets,
- replay audio,
- reduced motion,
- no time pressure by default.

## 13. QA governance

Required tests:

- `casa` completes correctly with physical keyboard,
- `casa` completes correctly with on-screen keyboard,
- wrong key does not advance,
- syllable completion fires event,
- word completion fires event,
- audio ID resolves,
- missing audio fails validation for release item,
- offline PWA loads lesson pack,
- child mode has no external links.

## 14. Release governance

Before any release:

- tests pass,
- curriculum validates,
- audio manifest validates,
- accessibility review complete,
- child safety review complete,
- privacy review complete,
- known issues documented,
- rollback plan exists.

## 15. Implementation phases

### Phase 0: Repo setup

Create app scaffold, testing, CI, docs.

### Phase 1: Engine

Build input engine, lesson engine, domain events, tests.

### Phase 2: UI

Build child lesson screen, typing boxes, keyboard, replay.

### Phase 3: Audio

Build manifest audio system and development TTS fallback.

### Phase 4: Curriculum

Add starter word pack, validators, review statuses.

### Phase 5: Progress

Add local progress and parent/teacher view.

### Phase 6: PWA

Add installability and offline caching.

### Phase 7: Pilot

Run QA, accessibility, privacy, pedagogy, and device review.

### Phase 8: Android

Package with Trusted Web Activity or Capacitor after PWA validation.

### Phase 9: iOS

Package with Capacitor after web/Android evidence and iOS audio testing.

## 16. Decision records required

Create ADRs for:

- backend introduction,
- account model,
- analytics,
- native wrapper route,
- audio model changes,
- curriculum data model changes,
- third-party SDKs,
- AI-generated child-facing content.

## 17. Codex working rule

Codex should make small changes, update tests, update docs, and never smuggle in tracking, accounts, or “engagement” nonsense while pretending it is pedagogy.
