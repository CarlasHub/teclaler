# TeclaLer Skills

Reusable workflows for Codex or humans.

## Skill 1: Feature planning

Use before behaviour changes.

Steps:

1. State user outcome.
2. Identify affected layers.
3. Check child-safety.
4. Check privacy.
5. Define acceptance criteria.
6. Define tests.
7. Decide whether ADR is needed.

## Skill 2: Curriculum update

Use when adding/changing words, syllables, sentences.

Steps:

1. Confirm locale.
2. Add item.
3. Add syllables.
4. Add graphemes.
5. Add target sequence.
6. Add audio IDs.
7. Set review status.
8. Run validator.

Rules:

- no mixed pt-PT/pt-BR,
- no release from draft,
- no missing audio for release.

## Skill 3: Audio asset pipeline

Use for audio files/manifests/playback.

Steps:

1. Identify audio kind.
2. Confirm locale.
3. Add manifest entry.
4. Add file path.
5. Validate path.
6. Review pronunciation.
7. Test playback/replay.

## Skill 4: UI screen build

Use for screens/components.

Steps:

1. Read UX spec.
2. Preserve visual hierarchy.
3. Build responsive layout.
4. Add keyboard/touch support.
5. Add accessible labels.
6. Add tests.
7. Screenshot review.

## Skill 5: Test generation

Use for behaviour changes.

Required tests:

- correct word completion,
- wrong key no advance,
- syllable completion event,
- word completion event,
- current key highlight,
- audio ID lookup.

## Skill 6: Privacy review

Use for storage/accounts/analytics/cloud/third-party changes.

Output:

```text
Data collected:
Storage:
Third parties:
Retention:
Child risk:
Decision:
```

## Skill 7: Release check

Use before any release.

Checks:

- tests,
- curriculum,
- audio,
- accessibility,
- privacy,
- child safety,
- known issues,
- rollback.
