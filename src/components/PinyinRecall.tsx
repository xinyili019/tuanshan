import { Eye, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isPinyinMatch, normalizePinyin } from "../lib/pinyin";
import type { ScriptMode, VocabEntry } from "../types";
import { speak } from "./FanCard";

interface PinyinRecallProps {
  entries: VocabEntry[];
  scriptMode: ScriptMode;
  title: string;
  onComplete: (troubleIds: string[]) => void;
  onGoBack: () => void;
}

export function PinyinRecall({ entries, scriptMode, title, onComplete, onGoBack }: PinyinRecallProps) {
  const [queue] = useState(() => shuffle(entries));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [troubleIds, setTroubleIds] = useState<string[]>([]);
  const active = queue[index];
  const headword = active ? (scriptMode === "traditional" ? active.traditional : active.simplified) : "";
  const speechLang = scriptMode === "traditional" ? "zh-TW" : "zh-CN";
  const correct = active ? isPinyinMatch(input, active.pinyin) : false;
  const cue = useMemo(() => (active ? Array.from(active.pinyin).map((char) => (char === " " ? " " : "_")).join("") : ""), [active]);

  useEffect(() => {
    setInput("");
    setSubmitted(false);
    setRevealed(false);
  }, [active?.id]);

  if (!active) {
    return (
      <section className="milestone fan-panel">
        <h2>Recall complete</h2>
        <button className="primary" type="button" onClick={() => onComplete(troubleIds)}>
          Continue
        </button>
      </section>
    );
  }

  function finishPrompt(wasTrouble: boolean) {
    const nextTrouble = wasTrouble && !troubleIds.includes(active.id) ? [...troubleIds, active.id] : troubleIds;
    if (wasTrouble) setTroubleIds(nextTrouble);

    if (index >= queue.length - 1) {
      onComplete(nextTrouble);
      return;
    }
    setIndex((current) => current + 1);
  }

  return (
    <section className="recall-panel fan-panel">
      <button className="go-back" type="button" onClick={onGoBack}>
        Go back
      </button>
      <div className="review-header">
        <p className="eyebrow">{title}</p>
        <strong>
          {index + 1} / {queue.length}
        </strong>
      </div>

      <div className="recall-cue">
        <span>{active.english}</span>
        <button className="icon-button" type="button" onClick={() => speak(headword, speechLang)} aria-label="Listen">
          <Volume2 size={18} aria-hidden="true" />
        </button>
      </div>

      <label className="pinyin-input-label">
        <span>Type the pinyin</span>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && input.trim()) setSubmitted(true);
          }}
          disabled={submitted || revealed}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
        />
      </label>

      <div className={`pinyin-slots ${submitted || revealed ? (correct && !revealed ? "is-correct" : "is-incorrect") : ""}`}>
        {(input || cue).split("").map((char, charIndex) => (
          <span key={`${active.id}-${charIndex}`}>{char === " " ? "\u00a0" : char}</span>
        ))}
      </div>

      {(submitted || revealed) && (
        <div className="recall-answer">
          <span className="recall-hanzi">{headword}</span>
          <span>{active.pinyin}</span>
          <span>{active.exampleSimplified}</span>
        </div>
      )}

      <div className="recall-actions">
        {!submitted && !revealed ? (
          <>
            <button className="secondary" type="button" onClick={() => setRevealed(true)}>
              <Eye size={18} aria-hidden="true" />
              Reveal
            </button>
            <button className="primary" type="button" onClick={() => setSubmitted(true)} disabled={!input.trim()}>
              Check
            </button>
          </>
        ) : (
          <button className="primary" type="button" onClick={() => finishPrompt(revealed || !correct)}>
            {index >= queue.length - 1 ? "Finish" : "Next"}
          </button>
        )}
      </div>

      {(submitted || revealed) && (
        <p className={`recall-feedback ${correct && !revealed ? "is-correct" : "is-incorrect"}`}>
          {correct && !revealed ? "Correct" : `Answer: ${normalizePinyin(active.pinyin)}`}
        </p>
      )}
    </section>
  );
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}
