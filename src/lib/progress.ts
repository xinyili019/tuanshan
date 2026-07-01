import type { CardStatus, ProgressRecord, ProgressState } from "../types";

const STORAGE_KEY = "tuanshan-progress-v1";

export function loadProgress(): ProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getProgress(progress: ProgressState, id: string): ProgressRecord {
  return progress[id] ?? { status: "new", reviewCount: 0, recallTroubleCount: 0 };
}

export function recordCard(progress: ProgressState, id: string, status: Exclude<CardStatus, "new">): ProgressState {
  const previous = getProgress(progress, id);
  return {
    ...progress,
    [id]: {
      ...previous,
      status,
      firstPassStatus: previous.firstPassStatus ?? status,
      reviewCount: previous.reviewCount + 1
    }
  };
}

export function recordRecallTrouble(progress: ProgressState, id: string): ProgressState {
  const previous = getProgress(progress, id);
  return {
    ...progress,
    [id]: {
      ...previous,
      status: "again",
      recallTroubleCount: previous.recallTroubleCount + 1
    }
  };
}
