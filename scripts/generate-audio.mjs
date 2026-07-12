import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const vocabularyPath = path.join(root, "src/data/vocabulary.ts");
const wordsDir = path.join(root, "public/audio/words");
const examplesDir = path.join(root, "public/audio/examples");

const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const wordsOnly = args.has("--words-only");
const examplesOnly = args.has("--examples-only");
const limit = readNumberArg("--limit");
const provider = process.env.TUANSHAN_TTS_PROVIDER ?? "openai";
const voice = process.env.TUANSHAN_TTS_VOICE ?? "marin";
const model = process.env.TUANSHAN_TTS_MODEL ?? "gpt-4o-mini-tts";
const responseFormat = process.env.TUANSHAN_TTS_FORMAT ?? "mp3";
const apiKey = process.env.OPENAI_API_KEY;

if (provider !== "openai") {
  fail(`Unsupported TUANSHAN_TTS_PROVIDER="${provider}". Use "openai".`);
}

if (!apiKey) {
  fail("OPENAI_API_KEY is required.");
}

if (wordsOnly && examplesOnly) {
  fail("Use only one of --words-only or --examples-only.");
}

await mkdir(wordsDir, { recursive: true });
await mkdir(examplesDir, { recursive: true });

const entries = parseVocabulary(await readFile(vocabularyPath, "utf8")).slice(0, limit ?? undefined);
const jobs = entries.flatMap((entry) => {
  const entryJobs = [];
  if (!examplesOnly) {
    entryJobs.push({
      entry,
      kind: "word",
      input: entry.simplified,
      destination: path.join(wordsDir, `${entry.id}.${responseFormat}`),
      instructions: wordInstructions(entry)
    });
  }
  if (!wordsOnly) {
    entryJobs.push({
      entry,
      kind: "example",
      input: entry.exampleSimplified,
      destination: path.join(examplesDir, `${entry.id}.${responseFormat}`),
      instructions: exampleInstructions(entry)
    });
  }
  return entryJobs;
});

let generated = 0;
let skipped = 0;
const startedAt = Date.now();

console.log(
  `Generating ${jobs.length} audio file(s) with ${model}, voice ${voice}${force ? " (overwriting existing files)" : ""}.`
);

for (const [index, job] of jobs.entries()) {
  const didGenerate = await maybeGenerate(job);
  if (didGenerate) generated += 1;
  else skipped += 1;
  printProgress({ current: index + 1, total: jobs.length, job, didGenerate });
}

console.log(
  `Complete: generated ${generated}, skipped ${skipped}, total ${jobs.length} in ${formatDuration(Date.now() - startedAt)}.`
);

async function maybeGenerate({ input, destination, instructions }) {
  if (!force && existsSync(destination)) return false;

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      voice,
      input,
      instructions,
      response_format: responseFormat
    })
  });

  if (!response.ok) {
    const body = await response.text();
    fail(`OpenAI TTS failed for ${destination}: ${response.status} ${body}`);
  }

  const audio = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, audio);
  return true;
}

function printProgress({ current, total, job, didGenerate }) {
  const percent = total === 0 ? 100 : Math.round((current / total) * 100);
  const elapsed = Date.now() - startedAt;
  const eta = current === 0 ? 0 : (elapsed / current) * (total - current);
  const status = didGenerate ? "generated" : "skipped";
  const file = path.relative(root, job.destination);
  console.log(
    `[${current}/${total}] ${String(percent).padStart(3)}% ${status} ${job.kind}: ${file} | ` +
      `new ${generated}, skipped ${skipped} | elapsed ${formatDuration(elapsed)}, ETA ${formatDuration(eta)}`
  );
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function parseVocabulary(source) {
  const jsonText = source
    .replace(/^import type .*?;\s*/s, "")
    .replace(/^export const vocabulary: VocabEntry\[] = /, "")
    .replace(/;\s*$/, "");

  return JSON.parse(jsonText);
}

function wordInstructions(entry) {
  return [
    "Speak in clear standard Mandarin Chinese.",
    "Use natural classroom pronunciation, steady pace, no English.",
    `The pinyin is ${entry.pinyin}.`
  ].join(" ");
}

function exampleInstructions() {
  return "Speak in clear standard Mandarin Chinese with natural sentence rhythm, steady pace, no English.";
}

function readNumberArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = Number(process.argv[index + 1]);
  if (!Number.isInteger(value) || value <= 0) fail(`${name} must be a positive integer.`);
  return value;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
