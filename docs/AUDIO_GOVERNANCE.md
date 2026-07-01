# Audio Governance

## Principle

Audio is core pedagogy. Treat it as content, not decoration.

## Production rule

Production must use approved audio assets from `audio_manifest.json`. Local placeholder audio and browser TTS are allowed only as development fallbacks.

Development fallback audio must still be spoken Portuguese, not tones or decorative sounds. TeclaLer includes local placeholder Portuguese voice files under `public/audio/` so starter lessons remain audible even when browser TTS is unavailable. If a local placeholder file is missing or cannot play, browser TTS is the next fallback. The pt-BR fallback should prefer a warm feminine Brazilian Portuguese voice when the browser provides one; all placeholder audio is temporary and does not replace reviewed release audio.

Letter fallback text must follow Portuguese spelling and early-reading needs. Where official alphabet-name variants exist, choose deliberately per locale and document the choice in `references/SOURCES.md`; for example, TeclaLer uses `guê` for pt-PT early letter learning and `gê` for pt-BR. Do not add written accents to unaccented target letters: the `A` in `CASA` is plain `a`, not `á`.

Browser TTS must never silently fall back to English or to the other Portuguese variant. A `pt-BR` lesson needs local `pt-BR` audio or an exact `pt-BR` browser voice; a `pt-PT` lesson needs local `pt-PT` audio or an exact `pt-PT` browser voice.

## Audio kinds

```text
letter
partial
syllable
word
sentence
feedback
```

## Manifest item

```json
{
  "id": "pt-PT.word.casa",
  "locale": "pt-PT",
  "kind": "word",
  "text": "casa",
  "path": "/audio/pt-PT/words/casa.wav",
  "voice": "human-pt-pt-001",
  "reviewStatus": "approved",
  "version": "1.0.0"
}
```

## Playback priority

1. Word completion audio.
2. Syllable completion audio.
3. Letter/key audio.
4. Feedback audio.

## Locale rule

Never silently replace `pt-PT` audio with `pt-BR` audio, or the reverse.

## QA

Before release:

- Every release curriculum audio ID exists.
- Every audio path exists.
- Every audio item has correct locale.
- Every release audio item is reviewed.
- Word completion audio plays after final key.
