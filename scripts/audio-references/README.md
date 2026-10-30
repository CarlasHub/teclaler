# Portuguese audio references

These two reference clips are synthetic voices created with the Apache-2.0
licensed `Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign` model. No person's voice or
child recording is used.

The `pt-PT` voice was designed as a calm, warm native Lisbon literacy teacher
with clear European Portuguese pronunciation and no Brazilian accent. The
`pt-BR` voice was designed as a calm, warm native Brazilian literacy teacher
with clear Brazilian Portuguese pronunciation and no European accent.

The exact reference transcripts are kept in `generatePortugueseAudio.py`. The
production generator uses the Apache-2.0 licensed
`Qwen/Qwen3-TTS-12Hz-1.7B-Base` model, adds a stable reading context to prevent
isolated-word pronunciation drift, and removes that context before saving each
lesson clip.
