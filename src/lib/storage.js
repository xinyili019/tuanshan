const STORAGE_KEY = "tuanshan-progress";
const LEGACY_STORAGE_KEY = "tuanshan-progress-v1";
const ACTIVE_SESSION_KEY = "activeSession";
const LAST_LOCATION_KEY = "lastLocation";
const WRITE_DEBOUNCE_MS = 500;
const VALID_STATUSES = new Set(["new", "again", "known"]);
const VALID_FIRST_PASS_STATUSES = new Set(["again", "known"]);
const VALID_ACTIVE_SESSION_MODES = new Set(["study", "review"]);
const VALID_LOCATION_VIEWS = new Set(["study", "browse"]);
const VALID_LOCATION_PHASES = new Set(["study", "summary", "review", "recall", "quiz", "browse", "complete"]);

const DEFAULT_SESSION = {
  totalStudiedWords: 0,
  studiedSinceQuizIds: [],
  lastQuizAtStudiedCount: 0,
  quizCount: 0,
  quizCompletedUnitIds: []
};

let memoryProgress = createEmptyProgress();
let memoryActiveSession = null;
let memoryLastLocation = null;
let pendingProgress = null;
let pendingWrite = null;
let preferencesPromise = null;

export async function getProgress() {
  if (pendingProgress) {
    return cloneProgress(pendingProgress);
  }

  const stored = await readProgressFromPreferredStorage();
  if (stored) {
    memoryProgress = stored;
    return cloneProgress(stored);
  }

  const migrated = await migrateLegacyProgress();
  if (migrated) {
    memoryProgress = migrated;
    return cloneProgress(migrated);
  }

  return cloneProgress(memoryProgress);
}

export async function setProgress(progress) {
  const validated = validateProgressState(progress);
  if (!validated.valid) {
    console.warn("Tuanshan progress was not saved because it has an invalid shape.");
    return;
  }

  memoryProgress = validated.progress;
  pendingProgress = cloneProgress(validated.progress);

  if (pendingWrite) {
    window.clearTimeout(pendingWrite.timer);
    pendingWrite.resolve();
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(async () => {
      const progressToWrite = pendingProgress ?? createEmptyProgress();
      pendingWrite = null;
      pendingProgress = null;
      await writeProgressToPreferredStorage(progressToWrite);
      resolve();
    }, WRITE_DEBOUNCE_MS);

    pendingWrite = { timer, resolve };
  });
}

export async function flushProgress() {
  if (!pendingWrite && !pendingProgress) return;

  if (pendingWrite) {
    window.clearTimeout(pendingWrite.timer);
    pendingWrite.resolve();
    pendingWrite = null;
  }

  const progressToWrite = pendingProgress ?? memoryProgress;
  pendingProgress = null;
  await writeProgressToPreferredStorage(progressToWrite);
}

export async function clearProgress() {
  if (pendingWrite) {
    window.clearTimeout(pendingWrite.timer);
    pendingWrite.resolve();
    pendingWrite = null;
  }

  pendingProgress = null;
  memoryProgress = createEmptyProgress();
  await removeProgressFromPreferredStorage();
}

export async function getActiveSession() {
  const raw = await readRaw(ACTIVE_SESSION_KEY);
  if (!raw) return cloneValue(memoryActiveSession);

  const parsed = parseStoredJson(raw, ACTIVE_SESSION_KEY);
  const normalized = normalizeActiveSession(parsed);
  if (!normalized) return cloneValue(memoryActiveSession);

  memoryActiveSession = normalized;
  return cloneValue(normalized);
}

export async function setActiveSession(session) {
  const normalized = normalizeActiveSession(session);
  if (!normalized) {
    console.warn("Tuanshan active session was not saved because it has an invalid shape.");
    return;
  }

  memoryActiveSession = normalized;
  await writeRaw(ACTIVE_SESSION_KEY, JSON.stringify(normalized));
}

export async function clearActiveSession() {
  memoryActiveSession = null;
  await removeRaw(ACTIVE_SESSION_KEY);
}

export async function getLastLocation() {
  const raw = await readRaw(LAST_LOCATION_KEY);
  if (!raw) return cloneValue(memoryLastLocation);

  const parsed = parseStoredJson(raw, LAST_LOCATION_KEY);
  const normalized = normalizeLastLocation(parsed);
  if (!normalized) return cloneValue(memoryLastLocation);

  memoryLastLocation = normalized;
  return cloneValue(normalized);
}

export async function setLastLocation(location) {
  const normalized = normalizeLastLocation(location);
  if (!normalized) {
    console.warn("Tuanshan location was not saved because it has an invalid shape.");
    return;
  }

  memoryLastLocation = normalized;
  await writeRaw(LAST_LOCATION_KEY, JSON.stringify(normalized));
}

export async function clearLastLocation() {
  memoryLastLocation = null;
  await removeRaw(LAST_LOCATION_KEY);
}

export function exportProgress(progress) {
  const validated = validateProgressState(progress);
  if (!validated.valid) {
    throw new Error("Progress data has an invalid shape.");
  }

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      progress: validated.progress
    },
    null,
    2
  );
}

export async function importProgress(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Progress import must be valid JSON.");
  }

  const candidate = parsed && typeof parsed === "object" && "progress" in parsed ? parsed.progress : parsed;
  const validated = validateProgressState(candidate);
  if (!validated.valid) {
    throw new Error("Progress import has an invalid shape.");
  }

  await setProgress(validated.progress);
  return cloneProgress(validated.progress);
}

export function validateProgressState(value) {
  const normalized = normalizeProgress(value);
  if (!normalized) {
    return { valid: false, progress: createEmptyProgress() };
  }

  return { valid: true, progress: normalized };
}

async function readProgressFromPreferredStorage() {
  const raw = await readRaw(STORAGE_KEY);
  if (!raw) return null;

  return parseStoredProgress(raw, STORAGE_KEY);
}

async function writeProgressToPreferredStorage(progress) {
  await writeRaw(STORAGE_KEY, JSON.stringify(progress), "progress");
}

async function writeRaw(key, raw, label = key) {
  const preferences = await getCapacitorPreferences();
  if (preferences) {
    try {
      await preferences.set({ key, value: raw });
      return;
    } catch (error) {
      console.warn(`Could not save ${label} with Capacitor Preferences. Falling back to localStorage.`, error);
    }
  }

  try {
    window.localStorage.setItem(key, raw);
  } catch (error) {
    console.warn(`Could not save ${label} with localStorage. Falling back to in-memory state.`, error);
  }
}

async function removeProgressFromPreferredStorage() {
  const preferences = await getCapacitorPreferences();
  if (preferences) {
    try {
      await preferences.remove({ key: STORAGE_KEY });
    } catch (error) {
      console.warn("Could not clear progress with Capacitor Preferences. Falling back to localStorage.", error);
    }
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.warn("Could not clear progress with localStorage. Falling back to in-memory progress.", error);
  }
}

async function removeRaw(key, label = key) {
  const preferences = await getCapacitorPreferences();
  if (preferences) {
    try {
      await preferences.remove({ key });
    } catch (error) {
      console.warn(`Could not clear ${label} with Capacitor Preferences. Falling back to localStorage.`, error);
    }
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Could not clear ${label} with localStorage. Falling back to in-memory state.`, error);
  }
}

async function migrateLegacyProgress() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.warn("Could not read legacy localStorage progress.", error);
  }

  if (!raw) return null;

  const legacyProgress = parseStoredProgress(raw, LEGACY_STORAGE_KEY);
  if (!legacyProgress) return null;

  await writeProgressToPreferredStorage(legacyProgress);
  return legacyProgress;
}

async function readRaw(key) {
  const preferences = await getCapacitorPreferences();
  if (preferences) {
    try {
      const result = await preferences.get({ key });
      if (result.value) return result.value;
    } catch (error) {
      console.warn("Could not read progress with Capacitor Preferences. Falling back to localStorage.", error);
    }
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn("Could not read progress with localStorage. Falling back to in-memory progress.", error);
    return null;
  }
}

async function getCapacitorPreferences() {
  if (!hasCapacitor()) return null;

  try {
    const preferencesPackage = "@capacitor/preferences";
    preferencesPromise ??= import(/* @vite-ignore */ preferencesPackage)
      .then((module) => module.Preferences)
      .catch((error) => {
        console.warn("Could not load Capacitor Preferences. Falling back to localStorage.", error);
        return null;
      });

    return await preferencesPromise;
  } catch (error) {
    console.warn("Could not initialize Capacitor Preferences. Falling back to localStorage.", error);
    return null;
  }
}

function parseStoredProgress(raw, source) {
  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeProgress(parsed);
    if (normalized) return normalized;
  } catch (error) {
    console.warn(`Could not parse ${source}. Falling back to empty progress.`, error);
    return null;
  }

  console.warn(`${source} has an invalid progress shape. Falling back to empty progress.`);
  return null;
}

function parseStoredJson(raw, source) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Could not parse ${source}. Falling back to in-memory state.`, error);
    return null;
  }
}

function normalizeProgress(value) {
  if (!isPlainObject(value)) return null;

  const wordsSource = isPlainObject(value.words) ? value.words : value;
  const words = {};
  for (const [id, record] of Object.entries(wordsSource)) {
    if (id === "words" || id === "session") continue;
    const normalizedRecord = normalizeRecord(record);
    if (!normalizedRecord) return null;
    words[id] = normalizedRecord;
  }

  const session = normalizeSession(value.session);
  if (!session) return null;

  return { words, session };
}

function normalizeRecord(record) {
  if (!isPlainObject(record)) return null;
  if (!VALID_STATUSES.has(record.status)) return null;
  if (!isNonNegativeInteger(record.reviewCount)) return null;
  if (!isNonNegativeInteger(record.recallTroubleCount)) return null;
  if (record.firstPassStatus !== undefined && !VALID_FIRST_PASS_STATUSES.has(record.firstPassStatus)) return null;

  return {
    status: record.status,
    reviewCount: record.reviewCount,
    recallTroubleCount: record.recallTroubleCount,
    ...(record.firstPassStatus ? { firstPassStatus: record.firstPassStatus } : {})
  };
}

function normalizeSession(session) {
  if (session === undefined) return { ...DEFAULT_SESSION };
  if (!isPlainObject(session)) return null;
  if (!isNonNegativeInteger(session.totalStudiedWords)) return null;
  if (!isStringArray(session.studiedSinceQuizIds)) return null;
  if (!isNonNegativeInteger(session.lastQuizAtStudiedCount)) return null;
  if (!isNonNegativeInteger(session.quizCount)) return null;
  if (!isStringArray(session.quizCompletedUnitIds)) return null;

  return {
    totalStudiedWords: session.totalStudiedWords,
    studiedSinceQuizIds: [...session.studiedSinceQuizIds],
    lastQuizAtStudiedCount: session.lastQuizAtStudiedCount,
    quizCount: session.quizCount,
    quizCompletedUnitIds: [...session.quizCompletedUnitIds]
  };
}

function normalizeActiveSession(session) {
  if (!isPlainObject(session)) return null;
  if (!VALID_ACTIVE_SESSION_MODES.has(session.mode)) return null;
  if (typeof session.moduleOrScenarioId !== "string") return null;
  if (typeof session.direction !== "string") return null;
  if (!isNonNegativeInteger(session.sessionIndex)) return null;
  if (!isStringArray(session.queue)) return null;
  if (!isNonNegativeInteger(session.position)) return null;
  if (!isStringArray(session.againQueue)) return null;
  if (!isNonNegativeInteger(session.startedAt)) return null;
  if (!isNonNegativeInteger(session.updatedAt)) return null;

  return {
    mode: session.mode,
    moduleOrScenarioId: session.moduleOrScenarioId,
    direction: session.direction,
    sessionIndex: session.sessionIndex,
    queue: [...session.queue],
    position: Math.min(session.position, Math.max(0, session.queue.length - 1)),
    againQueue: [...session.againQueue],
    startedAt: session.startedAt,
    updatedAt: session.updatedAt
  };
}

function normalizeLastLocation(location) {
  if (!isPlainObject(location)) return null;
  if (!VALID_LOCATION_VIEWS.has(location.view)) return null;
  if (!isPlainObject(location.params)) return null;
  if (typeof location.params.unit !== "string") return null;
  if (!VALID_LOCATION_PHASES.has(location.params.phase)) return null;
  if (!isNonNegativeInteger(location.params.sessionIndex)) return null;
  if (!isNonNegativeInteger(location.updatedAt)) return null;

  return {
    view: location.view,
    params: {
      unit: location.params.unit,
      phase: location.params.phase,
      sessionIndex: location.params.sessionIndex
    },
    updatedAt: location.updatedAt
  };
}

function createEmptyProgress() {
  return {
    words: {},
    session: { ...DEFAULT_SESSION }
  };
}

function hasCapacitor() {
  return typeof window !== "undefined" && Boolean(window.Capacitor);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function cloneProgress(progress) {
  return JSON.parse(JSON.stringify(progress));
}

function cloneValue(value) {
  return value == null ? null : JSON.parse(JSON.stringify(value));
}
