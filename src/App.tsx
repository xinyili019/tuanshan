import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { BrowseMode } from "./components/BrowseMode";
import { FanCard } from "./components/FanCard";
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
  clearProgress as clearStoredProgress,
  exportProgress,
  getProgress as getStoredProgress,
  importProgress,
  setProgress as setStoredProgress
} from "./lib/storage";
import type { ProgressState, QuizResult, ScriptMode, StudyPhase, VocabEntry } from "./types";
import "./styles.css";

const SESSION_SIZE = 20;
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
  const [unit, setUnit] = useState("all");
  const [phase, setPhase] = useState<StudyPhase>("study");
  const [sessionIndex, setSessionIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [againIds, setAgainIds] = useState<string[]>([]);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [view, setView] = useState<"study" | "browse">("study");
  const [quizEntries, setQuizEntries] = useState<VocabEntry[]>([]);
  const [quizContinueTarget, setQuizContinueTarget] = useState<"nextSession" | "complete">("nextSession");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isCurrent = true;

    getStoredProgress()
      .then((storedProgress: ProgressState) => {
        if (!isCurrent) return;
        setProgress(storedProgress);
      })
      .catch((error: unknown) => {
        console.warn("Could not load progress.", error);
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
  }, [isProgressReady, progress]);

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
        summary: UNIT_SUMMARIES[item] ?? "vocabulary"
      })),
    [scriptMode, units]
  );
  const entries = useMemo(
    () => (unit === "all" ? vocabulary : vocabulary.filter((entry) => entry.unit === unit)),
    [unit]
  );
  const sessions = useMemo(() => chunk(entries, SESSION_SIZE), [entries]);
  const currentSession = sessions[sessionIndex] ?? [];
  const reviewEntries = currentSession.filter((entry) => againIds.includes(entry.id));
  const activeEntries = phase === "review" ? reviewEntries : currentSession;
  const activeEntry = activeEntries[cardIndex];
  const knownCount = entries.filter((entry) => getProgressRecord(progress, entry.id).status === "known").length;
  const knownThisSession = currentSession.filter((entry) => getProgressRecord(progress, entry.id).status === "known").length;
  const againThisSession = reviewEntries.length;
  const sessionProgress =
    phase === "summary" || phase === "quiz" || phase === "complete"
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
    setPhase("study");
    setSessionIndex(0);
    setCardIndex(0);
    setRevealed(false);
    setAgainIds([]);
    setQuizEntries([]);
  }, [unit]);

  function advance() {
    setRevealed(false);
    if (cardIndex < activeEntries.length - 1) {
      setCardIndex((current) => current + 1);
      return;
    }

    if (phase === "review") {
      setPhase("summary");
      setCardIndex(0);
      return;
    }

    setPhase("summary");
    setCardIndex(0);
  }

  function mark(status: "again" | "known") {
    if (!activeEntry) return;
    setProgress((current) => recordCard(current, activeEntry.id, status, { countStudied: phase === "study" }));
    if (status === "again") {
      setAgainIds((current) => (current.includes(activeEntry.id) ? current : [...current, activeEntry.id]));
    } else {
      setAgainIds((current) => current.filter((id) => id !== activeEntry.id));
    }
    advance();
  }

  function nextSession() {
    const isEndOfUnit = sessionIndex >= sessions.length - 1;

    if (shouldStartQuizBeforeNextSession({ progress, unit, entries, isEndOfUnit })) {
      startQuiz(isEndOfUnit ? "complete" : "nextSession");
      return;
    }

    if (isEndOfUnit) {
      setPhase("complete");
      return;
    }

    goToNextStudySession();
  }

  function goToNextStudySession() {
    setSessionIndex((current) => current + 1);
    setCardIndex(0);
    setRevealed(false);
    setAgainIds([]);
    setPhase("study");
  }

  function startQuiz(target: "nextSession" | "complete") {
    const selected = selectQuizEntries(progress, entries, vocabulary);
    if (selected.length === 0) {
      target === "complete" ? setPhase("complete") : goToNextStudySession();
      return;
    }

    setQuizEntries(selected);
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
    setPhase("review");
    setCardIndex(0);
    setRevealed(false);
  }

  function startRecall() {
    setPhase("recall");
  }

  function finishRecall(troubleIds: string[]) {
    setProgress((current) => troubleIds.reduce((state, id) => recordRecallTrouble(state, id), current));
    if (troubleIds.length) {
      setAgainIds((current) => Array.from(new Set([...current, ...troubleIds])));
    }
    setCardIndex(0);
    setRevealed(false);
    setPhase("summary");
  }

  function finishQuiz(result: QuizResult) {
    const missedIds = result.missedEntries.map((entry) => entry.id);
    const quizUnitId = unit !== "all" && entries.length < SMALL_UNIT_QUIZ_LIMIT ? unit : undefined;
    setProgress((current) => recordQuizCompleted(demoteQuizMisses(current, missedIds), quizUnitId));
    setQuizEntries([]);

    if (quizContinueTarget === "complete") {
      setPhase("complete");
      return;
    }

    goToNextStudySession();
  }

  function startOver() {
    setProgress(createEmptyProgress());
    setProgressMessage("Progress cleared.");
    void clearStoredProgress();
    setView("study");
    setPhase("study");
    setSessionIndex(0);
    setCardIndex(0);
    setRevealed(false);
    setAgainIds([]);
    setQuizEntries([]);
  }

  function markForgotten(id: string) {
    setProgress((current) => demoteToAgain(current, id));
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
          <label>
            <span>Script</span>
            <select value={scriptMode} onChange={(event) => setScriptMode(event.target.value as ScriptMode)}>
              <option value="simplified">Simplified</option>
              <option value="traditional">Traditional</option>
            </select>
          </label>
          <label>
            <span>Unit</span>
            <select value={unit} onChange={(event) => setUnit(event.target.value)}>
              <option value="all">All units</option>
              {unitOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  Unit {item.id} {item.progressLabel} · {item.title}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-control">
            <input
              type="checkbox"
              checked={autoPlayAudio}
              onChange={(event) => setAutoPlayAudio(event.target.checked)}
            />
            <span>Auto audio</span>
          </label>
          <button
            className={`secondary header-browse-button${view === "browse" ? " is-active" : ""}`}
            type="button"
            onClick={() => setView((current) => (current === "browse" ? "study" : "browse"))}
          >
            {view === "browse" ? "Back to study" : "Browse"}
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
            onMarkForgotten={markForgotten}
          />
        ) : null}

        {view === "study" && (phase === "study" || phase === "review") ? (
          activeEntry ? (
            <FanCard
              entry={activeEntry}
              scriptMode={scriptMode}
              revealed={revealed}
              canGoPrevious={cardIndex > 0}
              showFirstWordTip={phase === "study" && sessionIndex === 0 && cardIndex === 0}
              autoPlayAudio={autoPlayAudio}
              onFlip={() => setRevealed((current) => !current)}
              onPrevious={() => {
                setRevealed(false);
                setCardIndex((current) => Math.max(0, current - 1));
              }}
              onGoBack={phase === "review" ? () => setPhase("summary") : undefined}
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
            entries={currentSession}
            scriptMode={scriptMode}
            onComplete={finishRecall}
            onGoBack={() => setPhase("summary")}
          />
        )}

        {view === "study" && phase === "quiz" && (
          <Quiz entries={quizEntries} allEntries={vocabulary} scriptMode={scriptMode} onContinue={finishQuiz} />
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
      </aside>
    </main>
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
