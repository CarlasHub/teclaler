#!/usr/bin/env python3
"""Generate controlled regional Portuguese lesson audio with Qwen3-TTS."""

from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel


MODEL_ID = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"
TARGET_SAMPLE_RATE = 24_000
TARGET_RMS_DBFS = -22.0
PEAK_LIMIT_DBFS = -1.5
BATCH_SIZE = 8
MAX_CROP_ATTEMPTS = 4
REFERENCE_CONFIG = {
    "pt-PT": {
        "file": "qwen-pt-PT.wav",
        "text": (
            "Olá! Vamos aprender a ler com calma. A casa fica perto do jardim. "
            "O gato brinca com a bola e a menina abre o livro. Muito bem, continua assim."
        ),
    },
    "pt-BR": {
        "file": "qwen-pt-BR.wav",
        "text": (
            "Olá! Vamos aprender a ler com calma. A casa fica perto do jardim. "
            "O gato brinca com a bola e a menina abre o livro. Muito bem, continue assim."
        ),
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--locale", choices=sorted(REFERENCE_CONFIG), required=True)
    parser.add_argument("--assets", type=Path, required=True)
    parser.add_argument("--references", type=Path, required=True)
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


def estimate_target_duration(text: str) -> float:
    words = re.findall(r"[^\W\d_]+", text, flags=re.UNICODE)
    character_count = sum(len(word) for word in words)
    return max(0.35, min(4.0, 0.30 + character_count * 0.05 + len(words) * 0.10))


def extract_target_audio(
    waveform: np.ndarray, sample_rate: int, target_text: str
) -> np.ndarray:
    """Remove the stable reading prompt before the final target utterance."""
    audio = np.asarray(waveform, dtype=np.float32).reshape(-1)
    frame_size = max(1, int(sample_rate * 0.02))
    frame_count = audio.size // frame_size
    if frame_count < 30:
        raise RuntimeError("Generated audio is too short to contain a target separator.")

    frames = audio[: frame_count * frame_size].reshape(frame_count, frame_size)
    rms = np.sqrt(np.mean(np.square(frames), axis=1))
    silence_threshold = max(0.0015, float(np.quantile(rms, 0.9)) * 0.10)
    silent = rms < silence_threshold
    runs: list[tuple[int, int]] = []
    run_start: int | None = None

    for frame_index, is_silent in enumerate(silent):
        if is_silent and run_start is None:
            run_start = frame_index
        elif not is_silent and run_start is not None:
            runs.append((run_start, frame_index))
            run_start = None

    if run_start is not None:
        runs.append((run_start, frame_count))

    minimum_separator_frames = math.ceil(0.04 / 0.02)
    separators = [
        run
        for run in runs
        if run[0] > frame_count * 0.3
        and run[1] < frame_count - 4
        and run[1] - run[0] >= minimum_separator_frames
    ]
    if not separators:
        raise RuntimeError("Qwen did not leave a safe separator before the target phrase.")

    active_frames = np.flatnonzero(~silent)
    final_speech_frame = int(active_frames[-1]) if active_frames.size else frame_count
    expected_duration = estimate_target_duration(target_text)
    target_words = re.findall(r"[^\W\d_]+", target_text, flags=re.UNICODE)
    if len(target_words) == 1:
        # A single token has no inter-word gap, so its boundary is the last
        # quiet run. This handles exceptionally short pauses before syllables.
        _, separator_end = separators[-1]
    else:
        # Pick the pause whose remaining speech best matches the target's
        # expected reading time. This rejects earlier pauses inside the stable
        # prompt and later word gaps inside multi-word feedback.
        _, separator_end = min(
            separators,
            key=lambda run: abs(
                (final_speech_frame - run[1]) * frame_size / sample_rate
                - expected_duration
            ),
        )
    lead_in = int(sample_rate * 0.06)
    start = max(0, separator_end * frame_size - lead_in)
    return audio[start:]


def normalize_audio(waveform: np.ndarray, sample_rate: int) -> np.ndarray:
    audio = np.asarray(waveform, dtype=np.float32).reshape(-1)
    if not audio.size or not np.isfinite(audio).all():
        raise RuntimeError("The model returned invalid audio.")

    audio -= float(np.mean(audio))
    peak = float(np.max(np.abs(audio)))
    if peak <= 1e-7:
        raise RuntimeError("The model returned silent audio.")

    threshold = max(peak * 0.004, 10 ** (-52 / 20))
    active = np.flatnonzero(np.abs(audio) >= threshold)
    if not active.size:
        raise RuntimeError("The model returned no audible speech.")
    head = int(sample_rate * 0.04)
    tail = int(sample_rate * 0.10)
    start = max(0, int(active[0]) - head)
    end = min(audio.size, int(active[-1]) + tail + 1)
    audio = audio[start:end]

    rms = math.sqrt(float(np.mean(np.square(audio), dtype=np.float64)))
    if rms <= 1e-7:
        raise RuntimeError("The model returned silent audio after trimming.")
    audio *= (10 ** (TARGET_RMS_DBFS / 20)) / rms

    peak_limit = 10 ** (PEAK_LIMIT_DBFS / 20)
    normalized_peak = float(np.max(np.abs(audio)))
    if normalized_peak > peak_limit:
        audio *= peak_limit / normalized_peak
    return np.clip(audio, -1.0, 1.0)


def main() -> None:
    args = parse_args()
    assets = json.loads(args.assets.read_text(encoding="utf-8"))
    model = load_model(args.model)
    config = REFERENCE_CONFIG[args.locale]
    reference_file = args.references / config["file"]
    prompt = model.create_voice_clone_prompt(
        ref_audio=str(reference_file),
        ref_text=config["text"],
    )

    for batch_start in range(0, len(assets), BATCH_SIZE):
        batch = assets[batch_start : batch_start + BATCH_SIZE]
        texts = [f"Vamos ler com atenção.\n\n{asset['text']}" for asset in batch]
        torch.manual_seed(int(batch[0]["seed"]))
        waveforms, sample_rate = model.generate_voice_clone(
            text=texts,
            language=["Portuguese"] * len(texts),
            voice_clone_prompt=prompt,
            top_k=20,
            top_p=0.9,
            temperature=0.7,
            repetition_penalty=1.1,
            subtalker_top_k=20,
            subtalker_top_p=0.9,
            subtalker_temperature=0.7,
            max_new_tokens=384,
        )
        if sample_rate != TARGET_SAMPLE_RATE:
            raise RuntimeError(
                f"Expected {TARGET_SAMPLE_RATE} Hz from Qwen, received {sample_rate} Hz."
            )
        if len(waveforms) != len(batch):
            raise RuntimeError("Qwen returned an incomplete synthesis batch.")

        for asset, waveform in zip(batch, waveforms, strict=True):
            last_error: RuntimeError | None = None
            for attempt in range(MAX_CROP_ATTEMPTS):
                try:
                    target_audio = extract_target_audio(
                        waveform, sample_rate, asset["text"]
                    )
                    audio = normalize_audio(target_audio, sample_rate)
                    break
                except RuntimeError as error:
                    last_error = error
                    if attempt == MAX_CROP_ATTEMPTS - 1:
                        raise RuntimeError(f"{asset['id']}: {error}") from error
                    print(
                        f"Retrying {asset['id']} after an unsafe target boundary "
                        f"({attempt + 2}/{MAX_CROP_ATTEMPTS}).",
                        flush=True,
                    )
                    torch.manual_seed(int(asset["seed"]) + attempt + 1)
                    retry_waveforms, retry_sample_rate = model.generate_voice_clone(
                        text=[f"Vamos ler com atenção.\n\n{asset['text']}"],
                        language=["Portuguese"],
                        voice_clone_prompt=prompt,
                        top_k=20,
                        top_p=0.9,
                        temperature=0.7,
                        repetition_penalty=1.1,
                        subtalker_top_k=20,
                        subtalker_top_p=0.9,
                        subtalker_temperature=0.7,
                        max_new_tokens=384,
                    )
                    if retry_sample_rate != TARGET_SAMPLE_RATE or len(retry_waveforms) != 1:
                        raise RuntimeError(
                            f"{asset['id']}: Qwen returned an invalid retry result."
                        )
                    waveform = retry_waveforms[0]
            else:  # pragma: no cover - the final attempt raises above
                raise RuntimeError(f"{asset['id']}: {last_error}")
            output_file = Path(asset["outputFile"])
            output_file.parent.mkdir(parents=True, exist_ok=True)
            sf.write(output_file, audio, sample_rate, subtype="PCM_16")

        completed = min(batch_start + len(batch), len(assets))
        print(f"Generated {completed}/{len(assets)} clips.", flush=True)


if __name__ == "__main__":
    main()
