export type ScriptMode = "simplified" | "traditional";
export type StudyPhase = "study" | "summary" | "review" | "recall" | "quiz" | "browse" | "complete";
export type CardStatus = "new" | "again" | "known";
export type QuizMode = "audioMeaning" | "sentenceCloze";

export interface ActiveSessionState {
  mode: Extract<StudyPhase, "study" | "review">;
  moduleOrScenarioId: string;
  direction: ScriptMode;
  sessionIndex: number;
  queue: string[];
  position: number;
  againQueue: string[];
  startedAt: number;
  updatedAt: number;
}

export interface LastLocationState {
  view: "study" | "browse";
  params: {
    unit: string;
    phase: StudyPhase;
    sessionIndex: number;
  };
  updatedAt: number;
}

export interface VocabEntry {
  id: string;
  unit: string;
  theme: string;
  partOfSpeech: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  english: string;
  exampleSimplified: string;
  exampleTraditional: string;
  examplePinyin: string;
  exampleEnglish: string;
}

export interface ProgressRecord {
  status: CardStatus;
  firstPassStatus?: Exclude<CardStatus, "new">;
  reviewCount: number;
  recallTroubleCount: number;
}

export interface ProgressSessionCounters {
  totalStudiedWords: number;
  studiedSinceQuizIds: string[];
  lastQuizAtStudiedCount: number;
  quizCount: number;
  quizCompletedUnitIds: string[];
}

export interface ProgressState {
  words: Record<string, ProgressRecord>;
  session: ProgressSessionCounters;
}

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  mode: QuizMode;
  entry: VocabEntry;
  prompt: string;
  context?: string;
  options: QuizOption[];
  correctOptionId: string;
}

export interface QuizResult {
  accuracy: number;
  correctFirstTry: number;
  total: number;
  missedEntries: VocabEntry[];
}
