import { spawn } from "node:child_process";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

interface QaResult {
  name: string;
  status: "pass" | "fail" | "skip";
  seconds: number;
  detail?: string;
}

const onWindows = process.platform === "win32";
const npmCommand = onWindows ? (process.env.ComSpec ?? "cmd.exe") : "npm";
const checks = [
  { name: "Unit behavior", args: ["test"] },
  { name: "Curriculum and audio", args: ["run", "validate:content"] },
  {
    name: "Pages production build",
    args: ["run", "build"],
    env: { VITE_BASE_PATH: "/teclaler/" },
  },
  { name: "Browser, touch and accessibility", args: ["run", "test:e2e"] },
  {
    name: "Production page and offline use",
    args: ["run", "test:production"],
    requires: "Pages production build",
  },
] as const;
const results: QaResult[] = [];

for (const check of checks) {
  if (
    "requires" in check &&
    results.find((result) => result.name === check.requires)?.status !== "pass"
  ) {
    results.push({
      name: check.name,
      status: "skip",
      seconds: 0,
      detail: "Production build failed.",
    });
    continue;
  }

  console.log(`QA: checking ${check.name}…`);
  const started = performance.now();
  const { code, output } = await runNpm(check.args, {
    ...process.env,
    ...("env" in check ? check.env : {}),
  });
  const seconds = Math.round((performance.now() - started) / 100) / 10;
  const status = code === 0 ? "pass" : "fail";
  const detail =
    status === "fail"
      ? output.trim().split(/\r?\n/u).slice(-24).join("\n")
      : undefined;
  results.push({ name: check.name, status, seconds, detail });
  console.log(`QA: ${status.toUpperCase()} ${check.name} (${seconds}s)`);
  if (detail) console.error(detail);
  if (status === "fail" && process.env.GITHUB_ACTIONS === "true") {
    console.error(
      `::error title=QA failure::${check.name} failed. See the QA summary and report artifact.`,
    );
  }
}

const qaDirectory = join(process.cwd(), ".qa");
await mkdir(qaDirectory, { recursive: true });
await writeFile(
  join(qaDirectory, "report.json"),
  JSON.stringify(
    {
      commit: process.env.GITHUB_SHA ?? null,
      browsers:
        process.env.QA_ALL_BROWSERS === "1"
          ? "Chromium and WebKit"
          : "local default",
      results,
    },
    null,
    2,
  ),
);

const summary = [
  "## TeclaLer QA",
  "",
  "| Check | Result | Seconds |",
  "| --- | --- | ---: |",
  ...results.map(
    (result) =>
      `| ${result.name} | ${result.status.toUpperCase()} | ${result.seconds} |`,
  ),
  "",
  ...results
    .filter((result) => result.status === "fail")
    .flatMap((result) => [
      `### ${result.name} failed`,
      "",
      "```text",
      result.detail ?? "No failure output was captured.",
      "```",
      "",
    ]),
].join("\n");
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary + "\n");
}
console.log(
  `QA: ${results.filter((result) => result.status === "pass").length}/${results.length} checks passed. Report: .qa/report.json`,
);
if (results.some((result) => result.status !== "pass")) process.exitCode = 1;

async function runNpm(
  args: readonly string[],
  env: NodeJS.ProcessEnv,
): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(npmCommand, onWindows ? ["/d", "/s", "/c", "npm", ...args] : [...args], {
      cwd: process.cwd(),
      env,
      windowsHide: true,
    });
    let output = "";
    let resolved = false;
    const finish = (code: number) => {
      if (resolved) return;
      resolved = true;
      resolve({ code, output });
    };
    const collect = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length > 200_000) output = output.slice(-200_000);
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.on("error", (error) => {
      output += `\n${error.message}`;
      finish(1);
    });
    child.on("close", (code) => finish(code ?? 1));
  });
}
