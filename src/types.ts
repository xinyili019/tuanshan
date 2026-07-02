export type ScriptMode = "simplified" | "traditional";
export type StudyPhase = "study" | "sessionChoice" | "review" | "recall" | "moveOn" | "complete";
export type CardStatus = "new" | "again" | "known";

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

export type ProgressState = Record<string, ProgressRecord>;
