import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { audioManifestsByLocale } from "../src/audio/manifest";
import type { AudioManifestAsset } from "../src/audio/types";
import type { PortugueseLocale } from "../src/curriculum/types";

type GenerationAsset = {
  id: string;
  kind: AudioManifestAsset["kind"];
  outputFile: string;
  seed: number;
  text: string;
};

const localeArgument = process.argv.find((value) =>
  value.startsWith("--locale="),
);
const locale = localeArgument?.slice("--locale=".length) as
  PortugueseLocale | undefined;
if (locale !== "pt-PT" && locale !== "pt-BR") {
  throw new Error("Pass --locale=pt-PT or --locale=pt-BR.");
}

const python = process.env.QWEN_TTS_PYTHON ?? "python3";
const force = process.argv.includes("--force");
const requestedAssetIds = new Set(
  process.argv
    .filter((value) => value.startsWith("--asset="))
    .map((value) => value.slice("--asset=".length)),
);
const manifest = audioManifestsByLocale[locale];
const pending: GenerationAsset[] = [];

for (const asset of manifest.assets) {
  if (requestedAssetIds.size > 0 && !requestedAssetIds.has(asset.id)) continue;
  const outputFile = join(process.cwd(), "public", asset.path.slice(1));
  if (!force) {
    try {
      if ((await stat(outputFile)).size > 4_000) continue;
    } catch {
      // A missing or empty file needs synthesis.
    }
  }

  pending.push({
    id: asset.id,
    kind: asset.kind,
    outputFile,
    seed: stableSeed(asset.id),
    text: getSynthesisText(locale, asset),
  });
}

for (const requestedAssetId of requestedAssetIds) {
  if (!manifest.assets.some(({ id }) => id === requestedAssetId)) {
    throw new Error(`Unknown ${locale} audio asset: ${requestedAssetId}`);
  }
}

if (pending.length === 0) {
  console.log(`All ${locale} audio clips already exist.`);
  process.exit(0);
}

const temporaryDirectory = await mkdtemp(
  join(tmpdir(), `teclaler-${locale.toLowerCase()}-audio-`),
);
const assetFile = join(temporaryDirectory, "assets.json");
await writeFile(assetFile, JSON.stringify(pending), "utf8");

try {
  const generatorFile = fileURLToPath(
    new URL("./generatePortugueseAudio.py", import.meta.url),
  );
  const referencesDirectory = fileURLToPath(
    new URL("./audio-references", import.meta.url),
  );
  const exitCode = await run(python, [
    generatorFile,
    "--locale",
    locale,
    "--assets",
    assetFile,
    "--references",
    referencesDirectory,
  ]);
  if (exitCode !== 0) {
    throw new Error(`Portuguese audio generator exited with code ${exitCode}.`);
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

for (const item of pending) {
  if ((await stat(item.outputFile)).size <= 4_000) {
    throw new Error(`Generated audio is empty: ${item.outputFile}`);
  }
}

console.log(`Generated ${pending.length} ${locale} WAV clips locally.`);

function getSynthesisText(
  targetLocale: PortugueseLocale,
  asset: AudioManifestAsset,
): string {
  if (asset.kind === "letter") {
    const letter = asset.id.slice(`${targetLocale}.letter.`.length);
    return `${getSpokenLetterName(targetLocale, letter)}.`;
  }

  if (asset.kind === "feedback") {
    const match = /letra\s+(.+)\.$/iu.exec(asset.text);
    if (!match) {
      throw new Error(`Cannot find feedback letter in ${asset.id}.`);
    }
    const letter = match[1].toLocaleLowerCase(targetLocale);
    return `Precisamos da letra ${getSpokenLetterName(targetLocale, letter)}.`;
  }

  const text = asset.text.trim();
  return /[.!?]$/u.test(text) ? text : `${text}.`;
}

function getSpokenLetterName(
  targetLocale: PortugueseLocale,
  letter: string,
): string {
  const common: Record<string, string> = {
    a: "Á",
    b: "Bê",
    c: "Cê",
    d: "Dê",
    e: "É",
    f: "Éfe",
    h: "Agá",
    i: "I",
    j: "Jota",
    l: "Éle",
    m: "Éme",
    n: "Éne",
    o: "Ó",
    p: "Pê",
    q: "Quê",
    r: "Erre",
    s: "Esse",
    t: "Tê",
    u: "U",
    v: "Vê",
    x: "Xis",
    y: "Ípsilon",
    z: "Zê",
    á: "Á",
    é: "É",
    í: "Í",
    ó: "Ó",
    ú: "Ú",
    â: "Â",
    ê: "Ê",
    ô: "Ô",
    ã: "Ã",
    õ: "Õ",
    à: "À",
    ç: "Cê cedilhado",
  };
  const regional =
    targetLocale === "pt-PT"
      ? { g: "Guê", k: "Capa", w: "Dâblio" }
      : { g: "Gê", k: "Cá", w: "Dáblio" };

  const name = regional[letter as keyof typeof regional] ?? common[letter];
  if (!name)
    throw new Error(`Missing ${targetLocale} letter name for ${letter}.`);
  return name;
}

function stableSeed(id: string): number {
  return createHash("sha256").update(id).digest().readUInt32BE(0) & 0x7fffffff;
}

async function run(command: string, args: string[]): Promise<number | null> {
  const child = spawn(command, args, { stdio: "inherit" });
  return await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
}
