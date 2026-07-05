import { getProgress, getStudiedCountSinceLastQuiz } from "./progress";
import type { ProgressState, QuizMode, QuizQuestion, ScriptMode, VocabEntry } from "../types";

export const QUIZ_INTERVAL = 40;
export const QUIZ_WORD_COUNT = 20;
export const SMALL_UNIT_QUIZ_LIMIT = 60;

export function shouldStartQuizBeforeNextSession({
  progress,
  unit,
  entries,
  isEndOfUnit
}: {
  progress: ProgressState;
  unit: string;
  entries: VocabEntry[];
  isEndOfUnit: boolean;
}) {
  if (!hasStudiedEntries(progress, entries)) return false;

  if (isSmallUnitMode(unit, entries)) {
    return isEndOfUnit && !progress.session.quizCompletedUnitIds.includes(unit);
  }

  return getStudiedCountSinceLastQuiz(progress) >= QUIZ_INTERVAL;
}

export function selectQuizEntries(progress: ProgressState, currentEntries: VocabEntry[], allEntries: VocabEntry[]) {
  const currentIds = new Set(currentEntries.map((entry) => entry.id));
  const allById = new Map(allEntries.map((entry) => [entry.id, entry]));
  const selected: VocabEntry[] = [];
  const selectedIds = new Set<string>();

  addEntries(
    progress.session.studiedSinceQuizIds
      .flatMap((id) => {
        const entry = allById.get(id);
        return entry && currentIds.has(entry.id) ? [entry] : [];
      }),
    selected,
    selectedIds
  );

  if (selected.length < QUIZ_WORD_COUNT) {
    addEntries(
      currentEntries.filter((entry) => getProgress(progress, entry.id).reviewCount > 0),
      selected,
      selectedIds
    );
  }

  if (selected.length < QUIZ_WORD_COUNT) {
    addEntries(currentEntries, selected, selectedIds);
  }

  return shuffle(selected).slice(0, QUIZ_WORD_COUNT);
}

export function buildQuizQuestions(entries: VocabEntry[], pool: VocabEntry[], scriptMode: ScriptMode): QuizQuestion[] {
  const shuffled = shuffle(entries);
  const firstRound = shuffled.slice(0, 10).map((entry) => buildQuestion("audioMeaning", entry, pool, scriptMode));
  const secondRound = shuffled.slice(10, 20).map((entry) => buildQuestion("sentenceCloze", entry, pool, scriptMode));

  return [...firstRound, ...secondRound];
}

export function reinsertQuestion<T>(rest: T[], question: T) {
  const next = [...rest];
  const offset = 3 + Math.floor(Math.random() * 2);
  next.splice(Math.min(offset, next.length), 0, question);
  return next;
}

export function getHeadword(entry: VocabEntry, scriptMode: ScriptMode) {
  return scriptMode === "traditional" ? entry.traditional : entry.simplified;
}

export function makeCloze(entry: VocabEntry, scriptMode: ScriptMode) {
  const headword = getHeadword(entry, scriptMode);
  const example = scriptMode === "traditional" ? entry.exampleTraditional : entry.exampleSimplified;
  return example.includes(headword) ? example.replace(headword, "＿＿") : `＿＿ · ${example}`;
}

function isSmallUnitMode(unit: string, entries: VocabEntry[]) {
  return unit !== "all" && entries.length < SMALL_UNIT_QUIZ_LIMIT;
}

function hasStudiedEntries(progress: ProgressState, entries: VocabEntry[]) {
  return entries.some((entry) => getProgress(progress, entry.id).reviewCount > 0);
}

function buildQuestion(
  mode: QuizMode,
  entry: VocabEntry,
  pool: VocabEntry[],
  scriptMode: ScriptMode
): QuizQuestion {
  const correctOptionId = entry.id;
  const options =
    mode === "audioMeaning"
      ? buildEnglishOptions(entry, pool)
      : buildHeadwordOptions(entry, pool, scriptMode);

  return {
    id: `${mode}-${entry.id}`,
    mode,
    entry,
    prompt: mode === "audioMeaning" ? "Choose the meaning" : makeCloze(entry, scriptMode),
    context: mode === "sentenceCloze" ? entry.exampleEnglish : undefined,
    options,
    correctOptionId
  };
}

function buildEnglishOptions(entry: VocabEntry, pool: VocabEntry[]) {
  const distractors = uniqueBy(
    shuffle(prioritizeUnitDistractors(entry, pool).filter((candidate) => candidate.english !== entry.english)),
    (candidate) => candidate.english
  ).slice(0, 3);

  return shuffle([
    { id: entry.id, label: entry.english },
    ...distractors.map((candidate) => ({ id: candidate.id, label: candidate.english }))
  ]);
}

function buildHeadwordOptions(entry: VocabEntry, pool: VocabEntry[], scriptMode: ScriptMode) {
  const correct = getHeadword(entry, scriptMode);
  const example = scriptMode === "traditional" ? entry.exampleTraditional : entry.exampleSimplified;
  const correctLength = Array.from(correct).length;
  const candidates = prioritizeUnitDistractors(entry, pool).filter((candidate) => {
    const headword = getHeadword(candidate, scriptMode);
    return headword !== correct && !example.includes(headword);
  });
  const distractors = uniqueBy(
    [
      ...shuffle(candidates.filter((candidate) => Array.from(getHeadword(candidate, scriptMode)).length === correctLength)),
      ...shuffle(candidates.filter((candidate) => Array.from(getHeadword(candidate, scriptMode)).length !== correctLength))
    ],
    (candidate) => getHeadword(candidate, scriptMode)
  ).slice(0, 2);

  return shuffle([
    { id: entry.id, label: correct },
    ...distractors.map((candidate) => ({ id: candidate.id, label: getHeadword(candidate, scriptMode) }))
  ]);
}

function addEntries(entries: VocabEntry[], selected: VocabEntry[], selectedIds: Set<string>) {
  for (const entry of entries) {
    if (selected.length >= QUIZ_WORD_COUNT || selectedIds.has(entry.id)) continue;
    selected.push(entry);
    selectedIds.add(entry.id);
  }
}

function prioritizeUnitDistractors(entry: VocabEntry, pool: VocabEntry[]) {
  const sameUnit = pool.filter((candidate) => candidate.id !== entry.id && candidate.unit === entry.unit);
  const adjacent = pool.filter((candidate) => candidate.id !== entry.id && candidate.unit !== entry.unit);
  return [...sameUnit, ...adjacent];
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}
