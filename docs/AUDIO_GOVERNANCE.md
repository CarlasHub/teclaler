# Audio Governance

## Principle

Audio is core pedagogy. Treat it as content, not decoration.

## Production rule

Production must use approved audio assets from `audio_manifest.json`. Browser TTS is allowed only as a development fallback.

## Audio kinds

```text
letter
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
  "path": "/audio/pt-PT/words/casa.mp3",
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
