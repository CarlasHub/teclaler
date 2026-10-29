import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const indexPath = join(dist, "index.html");
const html = await readFile(indexPath, "utf8");
const scriptTag = /<script type="module" crossorigin src="([^"]+)"><\/script>/u;
const styleTag = /<link rel="stylesheet" crossorigin href="([^"]+)">/u;
const scriptMatch = html.match(scriptTag);
const styleMatch = html.match(styleTag);
if (!scriptMatch || !styleMatch) {
  throw new Error("Expected one Vite script and stylesheet in index.html");
}

const basePath = process.env.VITE_BASE_PATH ?? "/";
const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
function assetFile(url: string): string {
  if (!url.startsWith(`${base}assets/`) || url.includes("..")) {
    throw new Error(`Unexpected built asset path: ${url}`);
  }
  return join(dist, url.slice(base.length));
}

const script = (await readFile(assetFile(scriptMatch[1]), "utf8")).replaceAll(
  /<\/script/giu,
  "<\\/script",
);
const style = (await readFile(assetFile(styleMatch[1]), "utf8")).replaceAll(
  /<\/style/giu,
  "<\\/style",
);
const inlined = html
  .replace(scriptTag, () => `<script type="module">\n${script}\n</script>`)
  .replace(styleTag, () => `<style>\n${style}\n</style>`);
await writeFile(indexPath, inlined);
console.log("Inlined app code and styles into index.html.");
