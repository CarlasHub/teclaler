import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const dist = join(process.cwd(), "dist");
const files: string[] = [];

async function collect(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile() && entry.name !== "sw.js") {
      files.push(`/${relative(dist, path).replaceAll("\\", "/")}`);
    }
  }
}

await collect(dist);
files.sort();
const hash = createHash("sha256");
for (const file of files) {
  hash.update(file);
  hash.update(await readFile(join(dist, file.slice(1))));
}
const version = `teclaler-${hash.digest("hex").slice(0, 16)}`;
const template = await readFile(join(dist, "sw.js"), "utf8");
if (!template.includes("__TECLALER_PRECACHE_PATHS__")) {
  throw new Error("Service worker precache placeholder is missing.");
}
await writeFile(
  join(dist, "sw.js"),
  template
    .replace("__TECLALER_CACHE_VERSION__", version)
    .replace("__TECLALER_PRECACHE_PATHS__", JSON.stringify(files)),
);
console.log(`Offline cache ${version}: ${files.length} files.`);
