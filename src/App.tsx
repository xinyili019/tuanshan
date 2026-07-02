import { useEffect, useMemo, useState } from "react";
import { FanCard } from "./components/FanCard";
import { PinyinRecall } from "./components/PinyinRecall";
import { vocabulary } from "./data/vocabulary";
import { getProgress, loadProgress, recordCard, recordRecallTrouble, saveProgress } from "./lib/progress";
import type { ProgressState, ScriptMode, StudyPhase, VocabEntry } from "./types";
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

export default function App() {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [scriptMode, setScriptMode] = useState<ScriptMode>("simplified");
  const [unit, setUnit] = useState("all");
  const [phase, setPhase] = useState<StudyPhase>("study");
  const [sessionIndex, setSessionIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [againIds, setAgainIds] = useState<string[]>([]);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);

  useEffect(() => saveProgress(progress), [progress]);

  const units = useMemo(() => Array.from(new Set(vocabulary.map((entry) => entry.unit))), []);
  const unitOptions = useMemo(
    () =>
      units.map((item) => ({
        id: item,
        title: vocabulary.find((entry) => entry.unit === item)?.theme ?? `Unit ${item}`,
        summary: UNIT_SUMMARIES[item] ?? "vocabulary"
      })),
    [units]
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
  const knownCount = entries.filter((entry) => getProgress(progress, entry.id).status === "known").length;
  const sessionProgress =
    phase === "sessionChoice" || phase === "moveOn" || phase === "complete"
      ? 100
      : activeEntries.length
        ? Math.min(100, (cardIndex / activeEntries.length) * 100)
        : 0;

  useEffect(() => {
    setPhase("study");
    setSessionIndex(0);
    setCardIndex(0);
    setRevealed(false);
    setAgainIds([]);
  }, [unit]);

  function advance() {
    setRevealed(false);
    if (cardIndex < activeEntries.length - 1) {
      setCardIndex((current) => current + 1);
      return;
    }

    if (phase === "review") {
      setPhase("moveOn");
      setCardIndex(0);
      return;
    }

    setPhase("sessionChoice");
    setCardIndex(0);
  }

  function mark(status: "again" | "known") {
    if (!activeEntry) return;
    setProgress((current) => recordCard(current, activeEntry.id, status));
    if (status === "again") {
      setAgainIds((current) => (current.includes(activeEntry.id) ? current : [...current, activeEntry.id]));
    }
    advance();
  }

  function nextSession() {
    if (sessionIndex >= sessions.length - 1) {
      setPhase("complete");
      return;
    }
    setSessionIndex((current) => current + 1);
    setCardIndex(0);
    setRevealed(false);
    setAgainIds([]);
    setPhase("study");
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
    if (reviewEntries.length === 0) {
      nextSession();
      return;
    }
    setPhase("recall");
  }

  function finishRecall(troubleIds: string[]) {
    setProgress((current) => troubleIds.reduce((state, id) => recordRecallTrouble(state, id), current));
    if (troubleIds.length) {
      setAgainIds(troubleIds);
    }
    setCardIndex(0);
    setRevealed(false);
    setPhase("moveOn");
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
                  Unit {item.id}: {item.title} - {item.summary}
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
        </div>
      </header>

      <section className="workspace">
        <span className="workspace-ornament ornament-top-left" aria-hidden="true" />
        <span className="workspace-ornament ornament-top-right" aria-hidden="true" />
        <span className="workspace-ornament ornament-bottom-left" aria-hidden="true" />
        <span className="workspace-ornament ornament-bottom-right" aria-hidden="true" />

        {phase === "study" || phase === "review" ? (
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
              onGoBack={phase === "review" ? () => setPhase("sessionChoice") : undefined}
              onAgain={() => mark("again")}
              onKnown={() => mark("known")}
            />
          ) : (
            <Milestone title="No words here yet." primary="Continue" onPrimary={nextSession} />
          )
        ) : null}

        {phase === "sessionChoice" && (
          <Milestone
            title={`Session complete. You have recognized ${knownCount} words.`}
            body={
              reviewEntries.length
                ? "Review the words you marked Again, or recall their pinyin from the English cue."
                : "No Again words in this session. Move on when ready."
            }
            primary={reviewEntries.length ? "Review new words" : "Next session"}
            secondary={reviewEntries.length ? "Recall pinyin" : undefined}
            onPrimary={reviewEntries.length ? startReview : nextSession}
            onSecondary={reviewEntries.length ? startRecall : undefined}
          />
        )}

        {phase === "recall" && (
          <PinyinRecall
            entries={reviewEntries}
            scriptMode={scriptMode}
            onComplete={finishRecall}
            onGoBack={() => setPhase("sessionChoice")}
          />
        )}

        {phase === "moveOn" && (
          <Milestone
            title="Session review complete."
            body="Move to the next session, or review these words once more."
            primary={reviewEntries.length ? "Review new words" : "Start next session"}
            secondary={reviewEntries.length ? "Start next session" : undefined}
            onPrimary={reviewEntries.length ? startReview : nextSession}
            onSecondary={reviewEntries.length ? nextSession : undefined}
          />
        )}

        {phase === "complete" && (
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

      <aside className="progress-panel">
        <p className="eyebrow">Session progress</p>
        <div className="progress-line" aria-label="Current session progress">
          <span style={{ width: `${sessionProgress}%` }} />
        </div>
      </aside>
    </main>
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
