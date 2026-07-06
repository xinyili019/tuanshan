import type { ActiveSessionState, LastLocationState, ProgressState } from "../types";

export function getProgress(): Promise<ProgressState>;
export function setProgress(progress: ProgressState): Promise<void>;
export function flushProgress(): Promise<void>;
export function clearProgress(): Promise<void>;
export function getActiveSession(): Promise<ActiveSessionState | null>;
export function setActiveSession(session: ActiveSessionState): Promise<void>;
export function clearActiveSession(): Promise<void>;
export function getLastLocation(): Promise<LastLocationState | null>;
export function setLastLocation(location: LastLocationState): Promise<void>;
export function clearLastLocation(): Promise<void>;
export function exportProgress(progress: ProgressState): string;
export function importProgress(raw: string): Promise<ProgressState>;
export function validateProgressState(value: unknown): { valid: boolean; progress: ProgressState };
