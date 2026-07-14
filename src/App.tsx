import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { BrowseMode } from "./components/BrowseMode";
import { FanCard } from "./components/FanCard";
import InstallControl from "./components/InstallControl";
import { PinyinRecall } from "./components/PinyinRecall";
import { Quiz } from "./components/Quiz";
import { vocabulary } from "./data/vocabulary";
import {
  createEmptyProgress,
  demoteQuizMisses,
  demoteToAgain,
  getProgressRecord,
  recordCard,
  recordQuizCompleted,
  recordRecallTrouble
} from "./lib/progress";
import { selectQuizEntries, shouldStartQuizBeforeNextSession, SMALL_UNIT_QUIZ_LIMIT } from "./lib/quiz";
import {
  clearActiveSession as clearStoredActiveSession,
  clearLastLocation as clearStoredLastLocation,
  clearProgress as clearStoredProgress,
  exportProgress,
  flushProgress as flushStoredProgress,
  getActiveSession as getStoredActiveSession,
  getLastLocation as getStoredLastLocation,
  getProgress as getStoredProgress,
  importProgress,
  setActiveSession as setStoredActiveSession,
  setLastLocation as setStoredLastLocation,
  setProgress as setStoredProgress
} from "./lib/storage";
import type {
  ActiveSessionState,
  LastLocationState,
  ProgressState,
  QuizResult,
  ScriptMode,
  StudyDirection,
  StudyPhase,
  VocabEntry
} from "./types";
import "./styles.css";

const SESSION_SIZE = 20;
const RESUME_MAX_AGE_MS = 48 * 60 * 60 * 1000;
const UNIT_SUMMARIES: Record<string, string> = {
  "1": "identity, pronouns, numbers",
  "2": "family and relationships",
  "3": "body and health",
  "4": "food and dining",
  "5": "home and objects",
  "6": "clothing and appearance",
  "7": "time and dates",
  "8": "study, work, digital life",
  "9": "travel, transport, directions",
  "10": "shopping and money",
  "11": "nature, weather, animals",
  "12": "feelings, communication, society"
};

const UNIT_PROGRESS_LABELS: Record<string, string> = {
  "1": "Identity",
  "2": "Family",
  "3": "Body and health",
  "4": "Food and dining",
  "5": "Home and objects",
  "6": "Appearance",
  "7": "Time and dates",
  "8": "Study and work",
  "9": "Travel and transport",
  "10": "Shopping",
  "11": "Nature",
  "12": "Feelings and communication"
};

const UNIT_SELECT_LABELS: Record<string, string> = {
  "1": "Identity",
  "2": "Family",
  "3": "Body/health",
  "4": "Food",
  "5": "Home",
  "6": "Appearance",
  "7": "Time",
  "8": "Study/work",
  "9": "Travel",
  "10": "Shopping",
  "11": "Nature",
  "12": "Feelings"
};

type QuizContinueTarget = "returnStudy" | "nextSession" | "unitSummary" | "finalSummary";
type ReviewReturnPhase = Extract<StudyPhase, "summary" | "unitSummary" | "finalSummary">;

const TRADITIONAL_UNIT_TITLES: Record<string, string> = {
  "1": "身份·人稱·數",
  "2": "家庭·關係",
  "3": "身體·健康",
  "4": "飲食",
  "5": "居家·物品",
  "6": "服裝·外貌",
  "7": "時間·日期",
  "8": "學習·工作·數字生活",
  "9": "出行·交通·方位",
  "10": "購物·金錢",
  "11": "自然·天氣·動物",
  "12": "情感·溝通·社會"
};

export default function App() {
  const [progress, setProgress] = useState<ProgressState>(() => createEmptyProgress());
  const [isProgressReady, setIsProgressReady] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [scriptMode, setScriptMode] = useState<ScriptMode>("simplified");
  const [studyDirection, setStudyDirection] = useState<StudyDirection>("hanziMeaning");
  const [unit, setUnit] = useState("all");
  const [phase, setPhase] = useState<StudyPhase>("study");
  const [sessionIndex, setSessionIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [againIds, setAgainIds] = useState<string[]>([]);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [view, setView] = useState<"study" | "browse">("study");
  const [quizEntries, setQuizEntries] = useState<VocabEntry[]>([]);
  const [recallEntries, setRecallEntries] = useState<VocabEntry[]>([]);
  const [quizContinueTarget, setQuizContinueTarget] = useState<QuizContinueTarget>("nextSession");
  const [quizScopeUnitId, setQuizScopeUnitId] = useState<string | null>(null);
  const [completedUnitId, setCompletedUnitId] = useState<string | null>(null);
  const [reviewReturnPhase, setReviewReturnPhase] = useState<ReviewReturnPhase>("summary");
  const [recallReturnPhase, setRecallReturnPhase] = useState<ReviewReturnPhase>("summary");
  const [sessionQueueIds, setSessionQueueIds] = useState<string[]>([]);
  const [pendingResume, setPendingResume] = useState<ActiveSessionState | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const activeSessionRef = useRef<ActiveSessionState | null>(null);
  const progressRef = useRef<ProgressState>(progress);
  const skipUnitResetRef = useRef(false);
  const manualQuizReturnRef = useRef<{
    sessionIndex: number;
    cardIndex: number;
    queueIds: string[];
    againIds: string[];
  } | null>(null);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([getStoredProgress(), getStoredActiveSession(), getStoredLastLocation()])
      .then(([storedProgress, activeSession, lastLocation]: [ProgressState, ActiveSessionState | null, LastLocationState | null]) => {
        if (!isCurrent) return;
        setProgress(storedProgress);
        restoreSavedNavigation(activeSession, lastLocation);
      })
      .catch((error: unknown) => {
        console.warn("Could not load stored app state.", error);
      })
      .finally(() => {
        if (isCurrent) setIsProgressReady(true);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!isProgressReady) return;
    void setStoredProgress(progress);
    progressRef.current = progress;
  }, [isProgressReady, progress]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const units = useMemo(() => Array.from(new Set(vocabulary.map((entry) => entry.unit))), []);
  const unitOptions = useMemo(
    () =>
      units.map((item) => ({
        id: item,
        title:
          scriptMode === "traditional"
            ? TRADITIONAL_UNIT_TITLES[item] ?? vocabulary.find((entry) => entry.unit === item)?.theme ?? `Unit ${item}`
            : vocabulary.find((entry) => entry.unit === item)?.theme ?? `Unit ${item}`,
        progressLabel: UNIT_PROGRESS_LABELS[item] ?? `Unit ${item}`,
        selectLabel: UNIT_SELECT_LABELS[item] ?? UNIT_PROGRESS_LABELS[item] ?? `Unit ${item}`,
        summary: UNIT_SUMMARIES[item] ?? "vocabulary"
      })),
    [scriptMode, units]
  );
  const entries = useMemo(
    () => (unit === "all" ? vocabulary : vocabulary.filter((entry) => entry.unit === unit)),
    [unit]
  );
  const sessions = useMemo(
    () =>
      unit === "all"
        ? units.flatMap((unitId) => chunk(vocabulary.filter((entry) => entry.unit === unitId), SESSION_SIZE))
        : chunk(entries, SESSION_SIZE),
    [entries, unit, units]
  );
  const entriesById = useMemo(() => new Map(vocabulary.map((entry) => [entry.id, entry])), []);
  const currentSession = useMemo(() => {
    const baseSession = sessions[sessionIndex] ?? [];
    if (sessionQueueIds.length === 0) return baseSession;

    const restoredSession = sessionQueueIds.flatMap((id) => {
      const entry = entriesById.get(id);
      return entry && (unit === "all" || entry.unit === unit) ? [entry] : [];
    });

    return restoredSession.length > 0 ? restoredSession : baseSession;
  }, [entriesById, sessionIndex, sessionQueueIds, sessions, unit]);
  const reviewEntries = currentSession.filter((entry) => againIds.includes(entry.id));
  const currentSessionUnitId = currentSession[0]?.unit ?? (unit === "all" ? completedUnitId ?? units[0] : unit);
  const currentUnitEntries = vocabulary.filter((entry) => entry.unit === currentSessionUnitId);
  const summaryUnitId = completedUnitId ?? currentSessionUnitId;
  const summaryUnitEntries = vocabulary.filter((entry) => entry.unit === summaryUnitId);
  const activeEntries = currentSession;
  const activeEntry = activeEntries[cardIndex];
  const knownCount = entries.filter((entry) => getProgressRecord(progress, entry.id).status === "known").length;
  const knownThisSession = currentSession.filter((entry) => getProgressRecord(progress, entry.id).status === "known").length;
  const againThisSession = reviewEntries.length;
  const sessionProgress =
    phase === "summary" || phase === "unitSummary" || phase === "finalSummary" || phase === "quiz" || phase === "complete"
      ? 100
      : activeEntries.length
        ? Math.min(100, (cardIndex / activeEntries.length) * 100)
        : 0;
  const unitProgress = useMemo(
    () =>
      unitOptions.map((option) => ({
        ...option,
        progressLabel: UNIT_PROGRESS_LABELS[option.id] ?? `Unit ${option.id}`,
        ...summarizeProgress(
          vocabulary.filter((entry) => entry.unit === option.id),
          progress
        )
      })),
    [progress, unitOptions]
  );

  useEffect(() => {
    if (skipUnitResetRef.current) {
      skipUnitResetRef.current = false;
      return;
    }

    let isCurrent = true;

    getStoredActiveSession()
      .then((storedSession: ActiveSessionState | null) => {
        if (!isCurrent) return;
        if (storedSession && isFresh(storedSession.updatedAt) && storedSession.moduleOrScenarioId === unit) {
          activeSessionRef.current = storedSession;
          setScriptMode(storedSession.direction === "traditional" ? "traditional" : "simplified");
          if (storedSession.studyDirection) setStudyDirection(storedSession.studyDirection);
          setSessionIndex(storedSession.sessionIndex);
          setCardIndex(storedSession.position);
          setRevealed(false);
          setAgainIds(storedSession.againQueue);
          setQuizEntries([]);
          setRecallEntries([]);
          setSessionQueueIds(storedSession.queue);
          setPhase(storedSession.mode);
          setPendingResume(storedSession);
          return;
        }

        setPhase("study");
        setSessionIndex(0);
        setCardIndex(0);
        setRevealed(false);
        setAgainIds([]);
        setQuizEntries([]);
        setRecallEntries([]);
        setSessionQueueIds([]);
        setPendingResume(null);
        setCompletedUnitId(null);
      })
      .catch((error: unknown) => {
        console.warn("Could not check active session.", error);
      });

    return () => {
      isCurrent = false;
    };
  }, [unit]);

  useEffect(() => {
    if (!isProgressReady) return;

    void setStoredLastLocation({
      view,
      params: { unit, phase, sessionIndex },
      updatedAt: Date.now()
    });
  }, [isProgressReady, phase, sessionIndex, unit, view]);

  useEffect(() => {
    if (!isProgressReady || pendingResume || view !== "study") return;

    if (phase !== "study" && phase !== "review") {
      if (phase === "summary" || phase === "complete") clearActiveSessionState();
      return;
    }

    if (!activeEntries.length || cardIndex >= activeEntries.length) return;
    persistActiveSession(buildActiveSession(cardIndex, againIds));
  }, [activeEntries, againIds, cardIndex, isProgressReady, pendingResume, phase, scriptMode, sessionIndex, studyDirection, unit, view]);

  useEffect(() => {
    function flushSessionState() {
      void flushStoredProgress();
      const activeSession = activeSessionRef.current;
      if (activeSession) {
        const updatedSession = { ...activeSession, updatedAt: Date.now() };
        activeSessionRef.current = updatedSession;
        void setStoredActiveSession(updatedSession);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") flushSessionState();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", flushSessionState);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", flushSessionState);
    };
  }, []);

  function advance() {
    setRevealed(false);
    if (cardIndex < activeEntries.length - 1) {
      setCardIndex((current) => current + 1);
      return;
    }

    if (phase === "review") {
      setSessionQueueIds([]);
      setPhase(reviewReturnPhase);
      setCardIndex(0);
      return;
    }

    setPhase("summary");
    setCardIndex(0);
  }

  function mark(status: "again" | "known") {
    if (!activeEntry) return;

    setProgress((current) => {
      const nextProgress = recordCard(current, activeEntry.id, status, { countStudied: phase === "study" });
      progressRef.current = nextProgress;
      void setStoredProgress(nextProgress);
      void flushStoredProgress();
      return nextProgress;
    });

    const nextAgainIds =
      status === "again"
        ? againIds.includes(activeEntry.id)
          ? againIds
          : [...againIds, activeEntry.id]
        : againIds.filter((id) => id !== activeEntry.id);

    setAgainIds(nextAgainIds);

    const nextPosition = cardIndex + 1;
    if (nextPosition < activeEntries.length) {
      persistActiveSession(buildActiveSession(nextPosition, nextAgainIds));
    } else {
      clearActiveSessionState();
    }

    advance();
  }

  function buildActiveSession(position: number, nextAgainIds: string[]): ActiveSessionState {
    const now = Date.now();
    const queue = activeEntries.map((entry) => entry.id);
    const current = activeSessionRef.current;
    const isSameSession =
      current?.mode === phase &&
      current.moduleOrScenarioId === unit &&
      current.sessionIndex === sessionIndex &&
      arraysEqual(current.queue, queue);

    return {
      mode: phase === "review" ? "review" : "study",
      moduleOrScenarioId: unit,
      direction: scriptMode,
      studyDirection,
      sessionIndex,
      queue,
      position: Math.min(position, Math.max(0, queue.length - 1)),
      againQueue: nextAgainIds,
      startedAt: isSameSession ? current.startedAt : now,
      updatedAt: now
    };
  }

  function persistActiveSession(session: ActiveSessionState) {
    activeSessionRef.current = session;
    void setStoredActiveSession(session);
  }

  function clearActiveSessionState() {
    activeSessionRef.current = null;
    void clearStoredActiveSession();
  }

  function nextSession() {
    const isFinalSession = sessionIndex >= sessions.length - 1;
    const nextSessionUnitId = sessions[sessionIndex + 1]?.[0]?.unit;
    const isEndOfUnit = isFinalSession || nextSessionUnitId !== currentSessionUnitId;
    const endOfUnitTarget: QuizContinueTarget = "unitSummary";
    const quizScope = currentUnitEntries;

    if (shouldStartQuizBeforeNextSession({ progress, unit: currentSessionUnitId, entries: quizScope, isEndOfUnit })) {
      if (isEndOfUnit) setCompletedUnitId(currentSessionUnitId);
      startQuiz(isEndOfUnit ? endOfUnitTarget : "nextSession", quizScope);
      return;
    }

    if (isEndOfUnit) {
      setCompletedUnitId(currentSessionUnitId);
      setPhase("unitSummary");
      return;
    }

    goToNextStudySession();
  }

  function goToNextStudySession() {
    setSessionIndex((current) => current + 1);
    setCardIndex(0);
    setRevealed(false);
    setAgainIds([]);
    setSessionQueueIds([]);
    setPendingResume(null);
    setCompletedUnitId(null);
    setPhase("study");
  }

  function getNextUnitId() {
    if (unit === "all") return null;
    const currentIndex = units.indexOf(unit);
    return currentIndex >= 0 ? units[currentIndex + 1] ?? null : null;
  }

  function goToNextUnit() {
    const nextUnitId = getNextUnitId();
    if (!nextUnitId) return false;
    setUnit(nextUnitId);
    setSessionIndex(0);
    setCardIndex(0);
    setRevealed(false);
    setAgainIds([]);
    setQuizEntries([]);
    setRecallEntries([]);
    setSessionQueueIds([]);
    setPendingResume(null);
    setCompletedUnitId(null);
    setPhase("study");
    return true;
  }

  function isKnownUnit(unitId: string) {
    return unitId === "all" || units.includes(unitId);
  }

  function startQuiz(target: QuizContinueTarget, requestedScope?: VocabEntry[]) {
    const quizScope = requestedScope ?? (target === "finalSummary" ? vocabulary : entries);
    const eligibleEntries =
      target === "returnStudy"
        ? quizScope.filter((entry) => getProgressRecord(progress, entry.id).reviewCount > 0)
        : quizScope;
    const selected = selectQuizEntries(progress, eligibleEntries, vocabulary);
    if (selected.length === 0) {
      if (target === "unitSummary" || target === "finalSummary") setPhase(target);
      return;
    }

    if (target === "returnStudy") {
      manualQuizReturnRef.current = {
        sessionIndex,
        cardIndex,
        queueIds: [...sessionQueueIds],
        againIds: [...againIds]
      };
    }

    setQuizEntries(selected);
    setQuizScopeUnitId(quizScope.length > 0 && quizScope.every((entry) => entry.unit === quizScope[0].unit) ? quizScope[0].unit : null);
    setQuizContinueTarget(target);
    setCardIndex(0);
    setRevealed(false);
    setPhase("quiz");
  }

  function startReview() {
    if (reviewEntries.length === 0) {
      nextSession();
      return;
    }
    setReviewReturnPhase("summary");
    setSessionQueueIds(reviewEntries.map((entry) => entry.id));
    setPhase("review");
    setCardIndex(0);
    setRevealed(false);
  }

  function startRecall() {
    setRecallReturnPhase("summary");
    setRecallEntries(selectRecallEntries(currentSession, reviewEntries));
    setPhase("recall");
  }

  function finishRecall(troubleIds: string[]) {
    setProgress((current) => {
      const nextProgress = troubleIds.reduce((state, id) => recordRecallTrouble(state, id), current);
      progressRef.current = nextProgress;
      void setStoredProgress(nextProgress);
      void flushStoredProgress();
      return nextProgress;
    });
    if (troubleIds.length) {
      setAgainIds((current) => Array.from(new Set([...current, ...troubleIds])));
    }
    setCardIndex(0);
    setRevealed(false);
    setRecallEntries([]);
    setPhase(recallReturnPhase);
  }

  function finishQuiz(result: QuizResult) {
    const missedIds = result.missedEntries.map((entry) => entry.id);
    const quizUnitId =
      quizContinueTarget === "unitSummary" &&
      quizScopeUnitId &&
      vocabulary.filter((entry) => entry.unit === quizScopeUnitId).length < SMALL_UNIT_QUIZ_LIMIT
        ? quizScopeUnitId
        : undefined;
    setProgress((current) =>
      recordQuizCompleted(
        demoteQuizMisses(current, missedIds),
        quizUnitId,
        { correctFirstTry: result.correctFirstTry, total: result.total },
        { resetCadence: quizContinueTarget !== "returnStudy" }
      )
    );
    setQuizEntries([]);
    setQuizScopeUnitId(null);

    if (quizContinueTarget === "returnStudy") {
      returnFromManualQuiz();
      return;
    }

    if (quizContinueTarget === "unitSummary" || quizContinueTarget === "finalSummary") {
      setPhase(quizContinueTarget);
      return;
    }

    goToNextStudySession();
  }

  function exitQuiz() {
    setQuizEntries([]);
    setQuizScopeUnitId(null);
    if (quizContinueTarget === "unitSummary" || quizContinueTarget === "finalSummary") {
      setPhase(quizContinueTarget);
      return;
    }
    if (quizContinueTarget === "returnStudy") {
      returnFromManualQuiz();
      return;
    }
    setPhase(quizContinueTarget === "nextSession" ? "summary" : "study");
  }

  function returnFromManualQuiz() {
    const origin = manualQuizReturnRef.current;
    manualQuizReturnRef.current = null;
    if (origin) {
      setSessionIndex(origin.sessionIndex);
      setCardIndex(origin.cardIndex);
      setSessionQueueIds(origin.queueIds);
      setAgainIds(origin.againIds);
    }
    setRevealed(false);
    setPhase("study");
  }

  function startScopedReview(scope: VocabEntry[], returnPhase: ReviewReturnPhase) {
    const difficult = scope.filter((entry) => getProgressRecord(progress, entry.id).status === "again");
    if (difficult.length === 0) return;
    setReviewReturnPhase(returnPhase);
    setAgainIds(difficult.map((entry) => entry.id));
    setSessionQueueIds(difficult.map((entry) => entry.id));
    setCardIndex(0);
    setRevealed(false);
    setPhase("review");
  }

  function startScopedRecall(scope: VocabEntry[], returnPhase: ReviewReturnPhase) {
    const studied = scope.filter((entry) => getProgressRecord(progress, entry.id).reviewCount > 0);
    const difficult = studied.filter((entry) => getProgressRecord(progress, entry.id).status === "again");
    setRecallReturnPhase(returnPhase);
    setRecallEntries(selectRecallEntries(studied, difficult));
    setPhase("recall");
  }

  function restoreSavedNavigation(activeSession: ActiveSessionState | null, lastLocation: LastLocationState | null) {
    if (activeSession && isFresh(activeSession.updatedAt) && isKnownUnit(activeSession.moduleOrScenarioId)) {
      skipUnitResetRef.current = true;
      activeSessionRef.current = activeSession;
      setView("study");
      setUnit(activeSession.moduleOrScenarioId);
      setScriptMode(activeSession.direction === "traditional" ? "traditional" : "simplified");
      if (activeSession.studyDirection) setStudyDirection(activeSession.studyDirection);
      setSessionIndex(activeSession.sessionIndex);
      setSessionQueueIds(activeSession.queue);
      setAgainIds(activeSession.againQueue);
      setCardIndex(activeSession.position);
      setRevealed(false);
      setPhase(activeSession.mode);
      setPendingResume(activeSession);
      return;
    }

    if (activeSession && !isFresh(activeSession.updatedAt)) {
      void clearStoredActiveSession();
    }

    if (!lastLocation || !isFresh(lastLocation.updatedAt) || !isKnownUnit(lastLocation.params.unit)) {
      if (lastLocation && !isFresh(lastLocation.updatedAt)) void clearStoredLastLocation();
      return;
    }

    skipUnitResetRef.current = true;
    setView(lastLocation.view);
    setUnit(lastLocation.params.unit);
    setSessionIndex(lastLocation.params.sessionIndex);
    setCardIndex(0);
    setRevealed(false);
    setAgainIds([]);
    setSessionQueueIds([]);
    setPhase(getRestorablePhase(lastLocation.params.phase));
  }

  function continueResumeSession() {
    if (!pendingResume) return;
    const updatedSession = { ...pendingResume, updatedAt: Date.now() };
    setPendingResume(null);
    persistActiveSession(updatedSession);
  }

  function restartResumeSession() {
    if (!pendingResume) return;
    clearActiveSessionState();
    setPendingResume(null);
    setPhase("study");
    setCardIndex(0);
    setRevealed(false);
    setAgainIds([]);
    setSessionQueueIds([]);
  }

  function startOver() {
    setProgress(createEmptyProgress());
    setProgressMessage("Progress cleared.");
    void clearStoredProgress();
    clearActiveSessionState();
    void clearStoredLastLocation();
    setView("study");
    setPhase("study");
    setSessionIndex(0);
    setCardIndex(0);
    setRevealed(false);
    setAgainIds([]);
    setQuizEntries([]);
    setRecallEntries([]);
    setSessionQueueIds([]);
    setPendingResume(null);
    setCompletedUnitId(null);
  }

  function setBrowseStatus(id: string, status: "again" | "known") {
    setProgress((current) => (status === "again" ? demoteToAgain(current, id) : recordCard(current, id, "known")));
  }

  function handleExportProgress() {
    try {
      const blob = new Blob([exportProgress(progress)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tuanshan-progress-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setProgressMessage("Progress exported.");
    } catch (error) {
      console.warn("Could not export progress.", error);
      setProgressMessage("Progress export failed.");
    }
  }

  async function handleImportProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const hasExistingProgress =
        Object.keys(progress.words).length > 0 ||
        progress.session.totalStudiedWords > 0 ||
        progress.session.quizCount > 0;
      if (hasExistingProgress && !window.confirm("Importing progress will overwrite your current Tuanshan progress.")) {
        setProgressMessage("Progress import cancelled.");
        return;
      }

      const importedProgress = await importProgress(await file.text());
      setProgress(importedProgress);
      setProgressMessage("Progress imported.");
    } catch (error) {
      console.warn("Could not import progress.", error);
      setProgressMessage("Progress import failed.");
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">團扇 TUANSHAN</p>
          <h1>Chinese Vocabulary</h1>
        </div>
        <div className="controls" aria-label="Study controls">
          <label className="select-pill study-mode-select-pill">
            <span className="select-pill-label">Study mode</span>
            <select
              aria-label="Study mode"
              value={`${scriptMode}:${studyDirection}`}
              onChange={(event) => {
                const [nextScript, nextDirection] = event.target.value.split(":") as [ScriptMode, StudyDirection];
                setScriptMode(nextScript);
                setStudyDirection(nextDirection);
                setRevealed(false);
              }}
            >
              <option value="simplified:hanziMeaning">Simplified · Hanzi → meaning</option>
              <option value="simplified:meaningHanzi">Simplified · Meaning → Hanzi</option>
              <option value="traditional:hanziMeaning">Traditional · Hanzi → meaning</option>
              <option value="traditional:meaningHanzi">Traditional · Meaning → Hanzi</option>
            </select>
          </label>
          <label className="select-pill unit-select-pill">
            <span className="select-pill-label">Unit</span>
            <select aria-label="Unit" value={unit} onChange={(event) => setUnit(event.target.value)}>
              <option value="all">All units</option>
              {unitOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  Unit {item.id} {item.selectLabel}
                </option>
              ))}
            </select>
          </label>
          <button
            className={`secondary header-browse-button${view === "browse" ? " is-active" : ""}`}
            type="button"
            onClick={() => setView((current) => (current === "browse" ? "study" : "browse"))}
          >
            Browse
          </button>
        </div>
      </header>

      <p className="app-tagline">The {vocabulary.length} words you will actually say.</p>

      <section className="workspace">
        <span className="workspace-ornament ornament-top-left" aria-hidden="true" />
        <span className="workspace-ornament ornament-top-right" aria-hidden="true" />
        <span className="workspace-ornament ornament-bottom-left" aria-hidden="true" />
        <span className="workspace-ornament ornament-bottom-right" aria-hidden="true" />

        {view === "browse" ? (
          <BrowseMode
            entries={vocabulary}
            progress={progress}
            scriptMode={scriptMode}
            units={unitOptions.map((item) => ({ id: item.id, title: `Unit ${item.id} ${item.progressLabel}` }))}
            onBack={() => setView("study")}
            onSetStatus={setBrowseStatus}
          />
        ) : null}

        {view === "study" && pendingResume && (phase === "study" || phase === "review") ? (
          <ResumePrompt session={pendingResume} onContinue={continueResumeSession} onRestart={restartResumeSession} />
        ) : null}

        {view === "study" && !pendingResume && (phase === "study" || phase === "review") ? (
          activeEntry ? (
            <FanCard
              entry={activeEntry}
              scriptMode={scriptMode}
              studyDirection={studyDirection}
              revealed={revealed}
              canGoPrevious={cardIndex > 0}
              showFirstWordTip={phase === "study" && sessionIndex === 0 && cardIndex === 0}
              autoPlayAudio={autoPlayAudio}
              onFlip={() => setRevealed(true)}
              onPrevious={() => {
                setRevealed(false);
                setCardIndex((current) => Math.max(0, current - 1));
              }}
              onGoBack={
                phase === "review"
                  ? () => {
                      setSessionQueueIds([]);
                      setPhase(reviewReturnPhase);
                    }
                  : undefined
              }
              onAgain={() => mark("again")}
              onKnown={() => mark("known")}
            />
          ) : (
            <Milestone title="No words here yet." primary="Continue" onPrimary={nextSession} />
          )
        ) : null}

        {view === "study" && phase === "summary" && (
          <SessionSummary
            sessionNumber={sessionIndex + 1}
            wordsStudied={currentSession.length}
            knownCount={knownThisSession}
            againCount={againThisSession}
            onReviewAgain={startReview}
            onRecall={startRecall}
            onNextSession={nextSession}
          />
        )}

        {view === "study" && phase === "recall" && (
          <PinyinRecall
            entries={recallEntries}
            scriptMode={scriptMode}
            onComplete={finishRecall}
            onGoBack={() => setPhase(recallReturnPhase)}
          />
        )}

        {view === "study" && phase === "quiz" && (
          <Quiz
            entries={quizEntries}
            allEntries={vocabulary}
            scriptMode={scriptMode}
            continueLabel={getQuizContinueLabel(quizContinueTarget)}
            onContinue={finishQuiz}
            onExit={exitQuiz}
          />
        )}

        {view === "study" && phase === "unitSummary" && (
          <CompletionSummary
            eyebrow={`Unit ${summaryUnitId} complete`}
            title={`${UNIT_PROGRESS_LABELS[summaryUnitId] ?? `Unit ${summaryUnitId}`} complete`}
            knownCount={summaryUnitEntries.filter((entry) => getProgressRecord(progress, entry.id).status === "known").length}
            totalCount={summaryUnitEntries.length}
            difficultCount={summaryUnitEntries.filter((entry) => getProgressRecord(progress, entry.id).status === "again").length}
            onReview={() => startScopedReview(summaryUnitEntries, "unitSummary")}
            onRecall={() => startScopedRecall(summaryUnitEntries, "unitSummary")}
            onQuiz={() => startQuiz("unitSummary", summaryUnitEntries)}
            onContinue={() => {
              setCompletedUnitId(null);
              if (unit === "all") {
                sessionIndex >= sessions.length - 1 ? setPhase("finalSummary") : goToNextStudySession();
                return;
              }
              if (!goToNextUnit()) setPhase("finalSummary");
            }}
            continueLabel={unit === "all" ? (sessionIndex >= sessions.length - 1 ? "Finish course" : "Next unit") : getNextUnitId() ? "Next unit" : "Finish course"}
          />
        )}

        {view === "study" && phase === "finalSummary" && (
          <CompletionSummary
            eyebrow="Course complete"
            title={`You have recognized ${vocabulary.filter((entry) => getProgressRecord(progress, entry.id).status === "known").length} words.`}
            knownCount={vocabulary.filter((entry) => getProgressRecord(progress, entry.id).status === "known").length}
            totalCount={vocabulary.length}
            difficultCount={vocabulary.filter((entry) => getProgressRecord(progress, entry.id).status === "again").length}
            quizScore={`${progress.session.quizFirstTryCorrect}/${progress.session.quizQuestions} correct on first attempts across ${progress.session.quizCount} quizzes`}
            onReview={() => startScopedReview(vocabulary, "finalSummary")}
            onRecall={() => startScopedRecall(vocabulary, "finalSummary")}
            onQuiz={() => startQuiz("finalSummary")}
            onBrowse={() => setView("browse")}
            onContinue={() => {
              setUnit("all");
              setSessionIndex(0);
              setPhase("study");
            }}
            continueLabel="Back to start"
            quizLabel="Final quiz"
            reviewLabel="Review Again words"
            recallLabel="Final pinyin recall"
          />
        )}

        {view === "study" && phase === "complete" && (
          <Milestone
            title={`All done. You have recognized ${knownCount} words.`}
            body="You can switch units or reset browser progress for a fresh pass."
            primary="Back to start"
            onPrimary={() => {
              setSessionIndex(0);
              setPhase("study");
            }}
          />
        )}
      </section>

      <aside className="progress-panel" aria-label="Study progress">
        <div className="progress-quick-actions" aria-label="Study options">
          <button
            className="secondary manual-quiz-button"
            type="button"
            disabled={phase !== "study" || !entries.some((entry) => getProgressRecord(progress, entry.id).reviewCount > 0)}
            onClick={() => startQuiz("returnStudy")}
          >
            <span aria-hidden="true">💡</span>
            Start quiz
          </button>
          <label className="checkbox-control">
            <input
              type="checkbox"
              checked={autoPlayAudio}
              onChange={(event) => setAutoPlayAudio(event.target.checked)}
            />
            <span className="checkbox-icon" aria-hidden="true" />
            <span>Auto audio</span>
          </label>
        </div>

        <section className="progress-section">
          <div className="progress-heading">
            <p className="eyebrow">Session progress</p>
            <span>{formatPercent(sessionProgress)}</span>
          </div>
          <div className="progress-line" aria-label="Current session progress">
            <span style={{ width: `${sessionProgress}%` }} />
          </div>
        </section>

        <section className="progress-section">
          <p className="eyebrow">Unit progress</p>
          <div className="unit-progress-list">
            {unitProgress.map((item) => (
              <div
                className={`unit-progress-item${unit === item.id ? " is-active" : ""}`}
                key={item.id}
                aria-current={unit === item.id ? "true" : undefined}
              >
                <div className="unit-progress-heading">
                  <span className="unit-progress-title">
                    Unit {item.id} {item.progressLabel}
                  </span>
                  <span className="unit-progress-value">{item.known}/{item.total}</span>
                </div>
                <div className="progress-line progress-line-unit" aria-label={`Unit ${item.id} progress`}>
                  <span style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <button className="start-over-button" type="button" onClick={startOver}>
          Start over
        </button>
        <InstallControl />
        <div className="progress-actions" aria-label="Progress file actions">
          <button className="secondary" type="button" onClick={handleExportProgress}>
            Export progress
          </button>
          <button className="secondary" type="button" onClick={() => importInputRef.current?.click()}>
            Import progress
          </button>
          <input
            ref={importInputRef}
            className="file-import-input"
            type="file"
            accept="application/json,.json"
            onChange={handleImportProgress}
          />
        </div>
        {progressMessage && <p className="progress-status">{progressMessage}</p>}
        <footer className="audio-disclosure">The voices you hear in Tuanshan are AI-generated and are not human voices.</footer>
      </aside>
    </main>
  );
}

function CompletionSummary({
  eyebrow,
  title,
  knownCount,
  totalCount,
  difficultCount,
  quizScore,
  onReview,
  onRecall,
  onQuiz,
  onBrowse,
  onContinue,
  continueLabel,
  quizLabel = "Unit quiz",
  reviewLabel = "Review difficult words",
  recallLabel = "Pinyin recall"
}: {
  eyebrow: string;
  title: string;
  knownCount: number;
  totalCount: number;
  difficultCount: number;
  quizScore?: string;
  onReview: () => void;
  onRecall: () => void;
  onQuiz: () => void;
  onBrowse?: () => void;
  onContinue: () => void;
  continueLabel: string;
  quizLabel?: string;
  reviewLabel?: string;
  recallLabel?: string;
}) {
  return (
    <section className="milestone completion-summary fan-panel">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="completion-count">{knownCount}/{totalCount} Known</p>
      {quizScore && <p className="completion-quiz-score">{quizScore}</p>}
      <div className="completion-review-actions">
        {difficultCount > 0 && (
          <button className="secondary" type="button" onClick={onReview}>
            {reviewLabel} ({difficultCount})
          </button>
        )}
        <button className="secondary" type="button" onClick={onRecall}>
          {recallLabel}
        </button>
        <button className="secondary" type="button" onClick={onQuiz}>
          {quizLabel}
        </button>
        {onBrowse && (
          <button className="secondary" type="button" onClick={onBrowse}>
            Browse all words
          </button>
        )}
      </div>
      <button className="primary completion-continue" type="button" onClick={onContinue}>
        {continueLabel}
      </button>
    </section>
  );
}

function SessionSummary({
  sessionNumber,
  wordsStudied,
  knownCount,
  againCount,
  onReviewAgain,
  onRecall,
  onNextSession
}: {
  sessionNumber: number;
  wordsStudied: number;
  knownCount: number;
  againCount: number;
  onReviewAgain: () => void;
  onRecall: () => void;
  onNextSession: () => void;
}) {
  return (
    <section className="milestone session-summary fan-panel">
      <p className="eyebrow">Session summary</p>
      <h2>
        Session {sessionNumber} · {wordsStudied} words studied
      </h2>
      <div className="session-summary-stats" aria-label="Session counts">
        <span>
          <strong>{knownCount}</strong>
          Known
        </span>
        <span>
          <strong>{againCount}</strong>
          Again
        </span>
      </div>
      <div className="session-summary-actions">
        <div className={`session-summary-secondary-row${againCount === 0 ? " is-single" : ""}`}>
          <button className="secondary" type="button" onClick={onRecall}>
            Pinyin recall
          </button>
          {againCount > 0 && (
            <button className="secondary" type="button" onClick={onReviewAgain}>
              Review ({againCount})
            </button>
          )}
        </div>
        <button className="primary session-summary-next" type="button" onClick={onNextSession}>
          Next session
        </button>
      </div>
    </section>
  );
}

function ResumePrompt({
  session,
  onContinue,
  onRestart
}: {
  session: ActiveSessionState;
  onContinue: () => void;
  onRestart: () => void;
}) {
  const position = Math.min(session.position + 1, session.queue.length);

  return (
    <section className="resume-prompt fan-panel" aria-label="Resume session">
      <p className="eyebrow">Session saved</p>
      <h2>Continue session ({position}/{session.queue.length})</h2>
      <p>Pick up exactly where you left off.</p>
      <div className="resume-actions">
        <button className="primary" type="button" onClick={onContinue}>
          Continue session
        </button>
        <button className="secondary" type="button" onClick={onRestart}>
          Restart
        </button>
      </div>
    </section>
  );
}

function Milestone({
  title,
  body,
  primary,
  secondary,
  onPrimary,
  onSecondary
}: {
  title: string;
  body?: string;
  primary: string;
  secondary?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
}) {
  return (
    <section className="milestone fan-panel">
      <p className="eyebrow">Milestone</p>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      <div className="milestone-actions">
        <button className="primary" type="button" onClick={onPrimary}>
          {primary}
        </button>
        {secondary && onSecondary && (
          <button className="secondary" type="button" onClick={onSecondary}>
            {secondary}
          </button>
        )}
      </div>
    </section>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function selectRecallEntries(sessionEntries: VocabEntry[], againEntries: VocabEntry[]) {
  if (againEntries.length > 8) return shuffle(againEntries);
  if (againEntries.length === 0) return shuffle(sessionEntries).slice(0, 8);

  const againIds = new Set(againEntries.map((entry) => entry.id));
  const fillers = shuffle(sessionEntries.filter((entry) => !againIds.has(entry.id))).slice(0, 8 - againEntries.length);
  return shuffle([...againEntries, ...fillers]);
}

function getQuizContinueLabel(target: QuizContinueTarget) {
  if (target === "unitSummary") return "Return to unit summary";
  if (target === "finalSummary") return "Return to course summary";
  if (target === "returnStudy") return "Return to study";
  return "Continue to next session";
}

function getRestorablePhase(phase: StudyPhase) {
  if (phase === "summary" || phase === "unitSummary" || phase === "finalSummary" || phase === "complete") return phase;
  return "study";
}

function isFresh(updatedAt: number) {
  return Date.now() - updatedAt < RESUME_MAX_AGE_MS;
}

function arraysEqual(first: string[], second: string[]) {
  if (first.length !== second.length) return false;
  return first.every((item, index) => item === second[index]);
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function summarizeProgress(items: VocabEntry[], progress: ProgressState) {
  const known = items.filter((entry) => getProgressRecord(progress, entry.id).status === "known").length;
  const total = items.length;
  return {
    known,
    total,
    percent: total ? (known / total) * 100 : 0
  };
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
