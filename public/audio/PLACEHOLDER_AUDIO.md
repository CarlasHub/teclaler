# Placeholder Audio

Local draft recordings follow `src/audio/manifest.ts`. Every manifest asset in a language uses one recorded voice. These recordings still need a native-speaking educator's listening review.

- pt-PT: all 250 manifest recordings use [OpenVoiceOS Dii for European Portuguese](https://huggingface.co/OpenVoiceOS/pipertts_pt-PT_dii), a female Piper voice. The model SHA-256 is `1cfdb672fd9ff00aa76ae7c7a5d032bf85c2d7b48b596997383b0131acc522d2`. Set `PIPER_EXECUTABLE` and `PIPER_MODEL` to the local Piper executable and this model, then run `npm run audio:generate-pt-pt`.
- pt-BR: all 94 manifest recordings use [OpenVoiceOS Dii for Brazilian Portuguese](https://huggingface.co/OpenVoiceOS/pipertts_pt-BR_dii), a female Piper voice. The model SHA-256 is `fb15a447ba7482b922e1d2fefea71c1031f760e72be24cce7794e26fe11d086b`. Set `PIPER_EXECUTABLE` and `PIPER_MODEL` to the local Piper executable and this model, then run `npm run audio:generate-pt-br`.
- en-GB: all 71 manifest recordings use the high-quality UK English female Cori Piper model, trained on public-domain LibriVox recordings. See the [model card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_GB/cori/high/MODEL_CARD). The model is not shipped in the app; its SHA-256 is `470b4dd634c98f8a4850d7626ffc3dfc90774628eeef6605a6dd8f88f30a5903`. Set `PIPER_EXECUTABLE` and `PIPER_MODEL` to the local Piper executable and this model, then run `npm run audio:generate-en-gb` to regenerate the clips.

The local recordings play by default, including offline. Browser speech synthesis is a fallback for an unavailable recording and uses the best matching installed voice for the locale, so its voice may differ across devices.

Dii is © TigreGotico Lda and its voice models are licensed [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/). These recordings are for the non-commercial TeclaLer pilot. A commercial release requires a separate license or replacement recordings. The model files are not shipped in the app.

Production/release audio must be replaced with reviewed recordings and marked approved in the audio manifest.
