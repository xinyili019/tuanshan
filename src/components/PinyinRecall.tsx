import { ArrowLeft, Eye, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { isPinyinMatch, normalizePinyin } from "../lib/pinyin";
import type { ScriptMode, VocabEntry } from "../types";
import { speak } from "./FanCard";

interface PinyinRecallProps {
  entries: VocabEntry[];
  scriptMode: ScriptMode;
  onComplete: (troubleIds: string[]) => void;
  onGoBack: () => void;
}

export function PinyinRecall({ entries, scriptMode, onComplete, onGoBack }: PinyinRecallProps) {
  const [queue] = useState(() => shuffle(entries));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [troubleIds, setTroubleIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const active = queue[index];
  const headword = active ? (scriptMode === "traditional" ? active.traditional : active.simplified) : "";
  const speechLang = "zh-CN";
  const correct = active ? isPinyinMatch(input, active.pinyin) : false;
  const inputLocked = revealed || (submitted && correct);
  const slotCharacters = useMemo(
    () => (active ? buildSlotCharacters(input, active.pinyin, submitted || revealed, revealed) : []),
    [active, input, revealed, submitted]
  );

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
        <ArrowLeft size={17} aria-hidden="true" />
        Back
      </button>

      <div className="recall-cue">
        <div className="recall-cue-copy">
          <span className="recall-english">{active.english}</span>
          <span className="recall-hanzi-cue">{headword}</span>
        </div>
        <button className="icon-button" type="button" onClick={() => speak(headword, speechLang)} aria-label="Listen">
          <Volume2 size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="pinyin-entry" onClick={() => inputRef.current?.focus()}>
        <input
          ref={inputRef}
          className="pinyin-ghost-input"
          aria-label="Type the full pinyin"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && input.trim()) setSubmitted(true);
          }}
          disabled={inputLocked}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
        />
        <div
          className={`pinyin-slots ${submitted || revealed ? "has-result" : ""}`}
          aria-hidden="true"
        >
          {slotCharacters.map((slot, charIndex) => (
            <span key={`${active.id}-${charIndex}`} className={slot.status ? `is-${slot.status}` : undefined}>
              {slot.char === " " ? "\u00a0" : slot.char}
            </span>
          ))}
        </div>
      </div>

      {revealed && (
        <div className="recall-answer">
          <span className="recall-hanzi">{headword}</span>
          <span>{active.pinyin}</span>
          <span>{active.exampleSimplified}</span>
        </div>
      )}

      <div className="recall-actions">
        {!revealed && (!submitted || !correct) ? (
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

      {submitted && correct && !revealed && <p className="recall-feedback is-correct">Correct</p>}

      {revealed && (
        <p className="recall-feedback is-answer">
          Answer: {active.pinyin}
        </p>
      )}
    </section>
  );
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildSlotCharacters(input: string, answer: string, showResult: boolean, revealed: boolean) {
  const typed = Array.from(normalizePinyin(input).replace(/\s/g, ""));
  let typedIndex = 0;

  return Array.from(answer).map((char) => {
    if (char === " ") return { char: " ", status: null };
    const typedChar = typed[typedIndex];
    typedIndex += 1;
    if (!showResult) return { char: typedChar ?? "_", status: null };

    if (!typedChar) {
      return { char: revealed ? normalizePinyin(char) || char : "_", status: "incorrect" };
    }

    const status = normalizePinyin(typedChar) === normalizePinyin(char) ? "correct" : "incorrect";
    return { char: typedChar, status };
  });
}
