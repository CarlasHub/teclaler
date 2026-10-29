# Placeholder Audio

Local draft recordings follow `src/audio/manifest.ts`. They are not reviewed production recordings.

- pt-PT starter clips use Joana; expanded pt-PT practice clips use a local Piper draft voice.
- pt-BR uses Luciana.
- en-GB uses the high-quality UK English female Cori Piper model, trained on public-domain LibriVox recordings. See the [model card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_GB/cori/high/MODEL_CARD). Browser fallback prefers Sonia, then Hazel or Susan when available.

The Cori model is not shipped in the app. Its SHA-256 is `470b4dd634c98f8a4850d7626ffc3dfc90774628eeef6605a6dd8f88f30a5903`. Set `PIPER_EXECUTABLE` and `PIPER_MODEL` to the local Piper executable and this model, then run `npm run audio:generate-en-gb` to regenerate all 71 clips.

Production/release audio must be replaced with reviewed recordings and marked approved in the audio manifest.
