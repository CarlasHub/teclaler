# Placeholder Audio

Local draft recordings follow `src/audio/manifest.ts`. Every manifest asset in a language uses one recorded voice. These recordings still need a native-speaking educator's listening review.

- pt-PT: all 250 manifest recordings use the same single-speaker Piper Tugão medium model. [Model card](https://huggingface.co/rhasspy/piper-voices/blob/main/pt/pt_PT/tug%C3%A3o/medium/MODEL_CARD). The model is not shipped in the app; its SHA-256 is `223a7aaca69a155c61897e8ada7c3b13bc306e16c72dbb9c2fed733e2b0927d4`. Set `PIPER_EXECUTABLE` and `PIPER_MODEL` to the local Piper executable and this model, then run `npm run audio:generate-pt-pt` to regenerate the clips.
- pt-BR: all 94 manifest recordings use Luciana.
- en-GB: all 71 manifest recordings use the high-quality UK English female Cori Piper model, trained on public-domain LibriVox recordings. See the [model card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_GB/cori/high/MODEL_CARD). The model is not shipped in the app; its SHA-256 is `470b4dd634c98f8a4850d7626ffc3dfc90774628eeef6605a6dd8f88f30a5903`. Set `PIPER_EXECUTABLE` and `PIPER_MODEL` to the local Piper executable and this model, then run `npm run audio:generate-en-gb` to regenerate the clips.

The local recordings play by default, including offline. Browser speech synthesis is a fallback for an unavailable recording and uses the best matching installed voice for the locale, so its voice may differ across devices.

Production/release audio must be replaced with reviewed recordings and marked approved in the audio manifest.
