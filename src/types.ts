export type ScriptMode = "simplified" | "traditional";
export type StudyPhase = "study" | "summary" | "review" | "recall" | "quiz" | "browse" | "complete";
export type CardStatus = "new" | "again" | "known";
export type QuizMode = "audioMeaning" | "sentenceCloze";

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
