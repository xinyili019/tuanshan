import type { ProgressState } from "../types";

export function getProgress(): Promise<ProgressState>;
export function setProgress(progress: ProgressState): Promise<void>;
export function clearProgress(): Promise<void>;
export function exportProgress(progress: ProgressState): string;
export function importProgress(raw: string): Promise<ProgressState>;
export function validateProgressState(value: unknown): { valid: boolean; progress: ProgressState };
