import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { wordIllustrations } from "../src/curriculum/wordIllustrations";

const version = "17.0.0";
const destination = join(process.cwd(), "public", "images");
await mkdir(destination, { recursive: true });

const failures: string[] = [];
for (const [word, illustration] of Object.entries(wordIllustrations)) {
  if (!illustration.code) continue;
  const url = `https://unpkg.com/openmoji@${version}/color/svg/${illustration.code}.svg`;
  const response = await fetch(url);
  const svg = await response.text();
  if (!response.ok || !svg.includes("<svg")) {
    failures.push(`${word}: ${response.status} ${url}`);
    continue;
  }
  await writeFile(join(destination, `word-${word}.svg`), svg);
}
if (failures.length) throw new Error(failures.join("\n"));
console.log("Imported pinned OpenMoji illustrations for every mapped word.");
