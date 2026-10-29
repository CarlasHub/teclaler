import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { ptPTAudioManifest } from "../src/audio/manifest";

const executable = process.env.PIPER_EXECUTABLE;
const model = process.env.PIPER_MODEL;
if (!executable || !model) {
  throw new Error(
    "Set PIPER_EXECUTABLE and PIPER_MODEL to generate local draft audio.",
  );
}

const pending: { text: string; output_file: string }[] = [];
for (const asset of ptPTAudioManifest.assets) {
  const file = join(process.cwd(), "public", asset.path.slice(1));
  try {
    if ((await stat(file)).size > 2000) continue;
  } catch {
    // A missing file needs synthesis.
  }
  await mkdir(dirname(file), { recursive: true });
  pending.push({ text: asset.text, output_file: file });
}

if (pending.length > 0) {
  const piper = spawn(
    executable,
    ["--model", model, "--json-input", "--quiet"],
    {
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  let stderr = "";
  piper.stderr.setEncoding("utf8");
  piper.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });
  piper.stdout.resume();
  piper.stdin.end(
    `${pending.map((item) => JSON.stringify(item)).join("\n")}\n`,
    "utf8",
  );
  const exitCode = await new Promise<number | null>((resolve, reject) => {
    piper.on("error", reject);
    piper.on("close", resolve);
  });
  if (exitCode !== 0) throw new Error(`Piper exited ${exitCode}: ${stderr}`);
}

for (const item of pending) {
  if ((await stat(item.output_file)).size <= 2000) {
    throw new Error(`Draft audio is empty: ${item.output_file}`);
  }
}
console.log(`Generated ${pending.length} pt-PT draft WAV clips locally.`);
