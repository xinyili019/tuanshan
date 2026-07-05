import type { CardStatus, ProgressRecord, ProgressSessionCounters, ProgressState } from "../types";

const DEFAULT_SESSION: ProgressSessionCounters = {
  totalStudiedWords: 0,
  studiedSinceQuizIds: [],
  lastQuizAtStudiedCount: 0,
  quizCount: 0,
  quizCompletedUnitIds: []
};

export function createEmptyProgress(): ProgressState {
  return {
    words: {},
    session: { ...DEFAULT_SESSION }
  };
}

export function normalizeProgress(value: unknown): ProgressState {
  if (!value || typeof value !== "object") return createEmptyProgress();
  const raw = value as Partial<ProgressState> & Record<string, unknown>;
  const wordsSource = raw.words && typeof raw.words === "object" && !Array.isArray(raw.words) ? raw.words : raw;

  const words = Object.fromEntries(
    Object.entries(wordsSource as Record<string, unknown>)
      .filter(([id, record]) => id !== "session" && id !== "words" && isProgressRecord(record))
      .map(([id, record]) => [id, normalizeRecord(record as Partial<ProgressRecord>)])
  );

  const rawSession = raw.session && typeof raw.session === "object" ? (raw.session as Partial<ProgressSessionCounters>) : {};
  return {
    words,
    session: {
      totalStudiedWords: safeNumber(rawSession.totalStudiedWords),
      studiedSinceQuizIds: safeStringArray(rawSession.studiedSinceQuizIds),
      lastQuizAtStudiedCount: safeNumber(rawSession.lastQuizAtStudiedCount),
      quizCount: safeNumber(rawSession.quizCount),
      quizCompletedUnitIds: safeStringArray(rawSession.quizCompletedUnitIds)
    }
  };
}

export function isProgressState(value: unknown): value is ProgressState {
  if (!value || typeof value !== "object") return false;
  const raw = value as Partial<ProgressState>;
  if (!raw.words || typeof raw.words !== "object" || Array.isArray(raw.words)) return false;
  if (!raw.session || typeof raw.session !== "object" || Array.isArray(raw.session)) return false;
  return Object.values(raw.words).every(isProgressRecord);
}

export function getProgress(progress: ProgressState, id: string): ProgressRecord {
  return progress.words[id] ?? { status: "new", reviewCount: 0, recallTroubleCount: 0 };
}

export const getProgressRecord = getProgress;

export function recordCard(
  progress: ProgressState,
  id: string,
  status: Exclude<CardStatus, "new">,
  options: { countStudied?: boolean } = {}
): ProgressState {
  const previous = getProgress(progress, id);
  const session = options.countStudied
    ? {
        ...progress.session,
        totalStudiedWords: progress.session.totalStudiedWords + 1,
        studiedSinceQuizIds: progress.session.studiedSinceQuizIds.includes(id)
          ? progress.session.studiedSinceQuizIds
          : [...progress.session.studiedSinceQuizIds, id]
      }
    : progress.session;

  return {
    ...progress,
    words: {
      ...progress.words,
      [id]: {
        ...previous,
        status,
        firstPassStatus: previous.firstPassStatus ?? status,
        reviewCount: previous.reviewCount + 1
      }
    },
    session
  };
}

export function markQuizComplete(progress: ProgressState, unitId?: string): ProgressState {
  return {
    ...progress,
    session: {
      ...progress.session,
      studiedSinceQuizIds: [],
      lastQuizAtStudiedCount: progress.session.totalStudiedWords,
      quizCount: progress.session.quizCount + 1,
      quizCompletedUnitIds:
        unitId && !progress.session.quizCompletedUnitIds.includes(unitId)
          ? [...progress.session.quizCompletedUnitIds, unitId]
          : progress.session.quizCompletedUnitIds
    }
  };
}

export const recordQuizCompleted = markQuizComplete;

export function demoteQuizMisses(progress: ProgressState, ids: string[]): ProgressState {
  return ids.reduce((state, id) => {
    const previous = getProgress(state, id);
    return {
      ...state,
      words: {
        ...state.words,
        [id]: {
          ...previous,
          status: "again"
        }
      }
    };
  }, progress);
}

export function getStudiedCountSinceLastQuiz(progress: ProgressState) {
  return Math.max(0, progress.session.totalStudiedWords - progress.session.lastQuizAtStudiedCount);
}

export function demoteToAgain(progress: ProgressState, id: string): ProgressState {
  const previous = getProgress(progress, id);
  return {
    ...progress,
    words: {
      ...progress.words,
      [id]: {
        ...previous,
        status: "again"
      }
    }
  };
}

export function recordRecallTrouble(progress: ProgressState, id: string): ProgressState {
  const previous = getProgress(progress, id);
  return {
    ...progress,
    words: {
      ...progress.words,
      [id]: {
        ...previous,
        status: "again",
        recallTroubleCount: previous.recallTroubleCount + 1
      }
    }
  };
}

function normalizeRecord(record: Partial<ProgressRecord>): ProgressRecord {
  return {
    status: record.status === "known" || record.status === "again" ? record.status : "new",
    firstPassStatus:
      record.firstPassStatus === "known" || record.firstPassStatus === "again" ? record.firstPassStatus : undefined,
    reviewCount: safeNumber(record.reviewCount),
    recallTroubleCount: safeNumber(record.recallTroubleCount)
  };
}

function isProgressRecord(value: unknown): value is ProgressRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ProgressRecord>;
  return record.status === "new" || record.status === "again" || record.status === "known";
}

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function safeStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
