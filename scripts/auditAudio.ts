import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { audioManifestsByLocale } from "../src/audio/manifest";
import type { LessonLocale } from "../src/curriculum/types";

const localeArgument = process.argv.find((value) =>
  value.startsWith("--locale="),
);
const requestedLocale = localeArgument?.slice("--locale=".length) as
  LessonLocale | undefined;
const locales = requestedLocale
  ? [requestedLocale]
  : (["pt-PT", "pt-BR"] satisfies LessonLocale[]);
const errors: string[] = [];
let audited = 0;

for (const locale of locales) {
  const manifest = audioManifestsByLocale[locale];
  if (!manifest) throw new Error(`Unsupported audio locale: ${locale}`);

  for (const asset of manifest.assets) {
    const file = join(process.cwd(), "public", asset.path.slice(1));
    try {
      const wav = parsePcmWav(await readFile(file));
      const duration = wav.samples.length / wav.sampleRate;
      const peak = wav.samples.reduce(
        (value, sample) => Math.max(value, Math.abs(sample)),
        0,
      );
      const rms = Math.sqrt(
        wav.samples.reduce((sum, sample) => sum + sample * sample, 0) /
          wav.samples.length,
      );
      const peakDbfs = toDbfs(peak);
      const rmsDbfs = toDbfs(rms);
      const maximumDuration =
        asset.kind === "feedback" ? 7 : asset.kind === "letter" ? 3.5 : 6;

      if (wav.channels !== 1) errors.push(`${asset.id}: expected mono audio`);
      if (wav.sampleRate !== 24_000 && locale !== "en-GB") {
        errors.push(`${asset.id}: expected 24000 Hz, got ${wav.sampleRate}`);
      }
      if (wav.bitsPerSample !== 16) {
        errors.push(`${asset.id}: expected PCM16 audio`);
      }
      if (duration < 0.2 || duration > maximumDuration) {
        errors.push(`${asset.id}: suspicious ${duration.toFixed(2)}s duration`);
      }
      if (peakDbfs > -1 || peakDbfs < -18) {
        errors.push(`${asset.id}: suspicious ${peakDbfs.toFixed(1)} dBFS peak`);
      }
      if (rmsDbfs > -14 || rmsDbfs < -32) {
        errors.push(`${asset.id}: suspicious ${rmsDbfs.toFixed(1)} dBFS RMS`);
      }
      audited += 1;
    } catch (error) {
      errors.push(
        `${asset.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

if (errors.length > 0) {
  throw new Error(`Audio audit failed:\n${errors.join("\n")}`);
}
console.log(`Audio audit passed for ${audited} manifest WAV files.`);

function parsePcmWav(buffer: Buffer): {
  bitsPerSample: number;
  channels: number;
  sampleRate: number;
  samples: number[];
} {
  if (
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new Error("not a RIFF/WAVE file");
  }

  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let audioFormat = 0;
  let data: Buffer | undefined;
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (start + size > buffer.length) throw new Error("truncated WAV chunk");
    if (id === "fmt ") {
      audioFormat = buffer.readUInt16LE(start);
      channels = buffer.readUInt16LE(start + 2);
      sampleRate = buffer.readUInt32LE(start + 4);
      bitsPerSample = buffer.readUInt16LE(start + 14);
    } else if (id === "data") {
      data = buffer.subarray(start, start + size);
    }
    offset = start + size + (size % 2);
  }

  if (audioFormat !== 1 || bitsPerSample !== 16 || !data) {
    throw new Error("expected PCM16 WAV data");
  }
  const samples = new Array<number>(data.length / 2);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = data.readInt16LE(index * 2) / 32_768;
  }
  return { bitsPerSample, channels, sampleRate, samples };
}

function toDbfs(value: number): number {
  return value > 0 ? 20 * Math.log10(value) : Number.NEGATIVE_INFINITY;
}
