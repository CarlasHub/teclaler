#!/usr/bin/env python3
"""Generate a reproducible synthetic reference voice for Portuguese audio."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel


MODEL_ID = "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"
DEFAULT_SEED = {"pt-PT": 20261030, "pt-BR": 20261031}
REFERENCE_TEXT = {
    "pt-PT": (
        "Olá! Vamos aprender a ler com calma. A casa fica perto do jardim. "
        "O gato brinca com a bola e a menina abre o livro. Muito bem, continua assim."
    ),
    "pt-BR": (
        "Olá! Vamos aprender a ler com calma. A casa fica perto do jardim. "
        "O gato brinca com a bola e a menina abre o livro. Muito bem, continue assim."
    ),
}
VOICE_INSTRUCTION = {
    "pt-PT": (
        "A warm adult European Portuguese literacy teacher with a natural, neutral "
        "Lisbon accent. Speak clearly at a calm, moderately slow teaching pace, with "
        "precise consonants and natural sentence melody. Clean studio recording. No "
        "singing, whispering, exaggerated character voice, or Brazilian accent."
    ),
    "pt-BR": (
        "A warm adult Brazilian Portuguese literacy teacher with a natural, neutral "
        "São Paulo accent. Speak clearly at a calm, moderately slow teaching pace, "
        "with precise consonants and natural sentence melody. Clean studio recording. "
        "No singing, whispering, breathiness, vocal fry, exaggerated character voice, "
        "or European Portuguese accent."
    ),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--locale", choices=sorted(REFERENCE_TEXT), required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--seed", type=int)
    parser.add_argument("--model", default=MODEL_ID)
    return parser.parse_args()


def load_model(model_id: str) -> Qwen3TTSModel:
    if torch.backends.mps.is_available():
        device, dtype = "mps", torch.float32
    elif torch.cuda.is_available():
        device, dtype = "cuda:0", torch.bfloat16
    else:
        device, dtype = "cpu", torch.float32
    print(f"Loading {model_id} on {device}.", flush=True)
    return Qwen3TTSModel.from_pretrained(
        model_id,
        device_map=device,
        dtype=dtype,
        attn_implementation="eager",
    )


def main() -> None:
    args = parse_args()
    seed = args.seed if args.seed is not None else DEFAULT_SEED[args.locale]
    torch.manual_seed(seed)
    model = load_model(args.model)
    waveforms, sample_rate = model.generate_voice_design(
        text=REFERENCE_TEXT[args.locale],
        instruct=VOICE_INSTRUCTION[args.locale],
        language="Portuguese",
        top_k=20,
        top_p=0.85,
        temperature=0.6,
        repetition_penalty=1.1,
        subtalker_top_k=20,
        subtalker_top_p=0.85,
        subtalker_temperature=0.6,
        max_new_tokens=1024,
    )
    if len(waveforms) != 1 or sample_rate != 24_000:
        raise RuntimeError("VoiceDesign returned an invalid reference clip.")

    audio = np.asarray(waveforms[0], dtype=np.float32).reshape(-1)
    if not audio.size or not np.isfinite(audio).all():
        raise RuntimeError("VoiceDesign returned invalid audio.")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    sf.write(args.output, audio, sample_rate, subtype="PCM_16")
    print(
        f"Generated {args.locale} reference at {args.output} "
        f"({audio.size / sample_rate:.2f}s).",
        flush=True,
    )


if __name__ == "__main__":
    main()
