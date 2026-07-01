import { BookOpen, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ScriptMode, VocabEntry } from "../types";
import { StrokeOrder } from "./StrokeOrder";

interface FanCardProps {
  entry: VocabEntry;
  scriptMode: ScriptMode;
  revealed: boolean;
  canGoPrevious: boolean;
  onFlip: () => void;
  onPrevious: () => void;
  onAgain: () => void;
  onKnown: () => void;
}

export function FanCard({
  entry,
  scriptMode,
  revealed,
  canGoPrevious,
  onFlip,
  onPrevious,
  onAgain,
  onKnown
}: FanCardProps) {
  const [showStrokeOrder, setShowStrokeOrder] = useState(false);
  const headword = scriptMode === "traditional" ? entry.traditional : entry.simplified;
  const example = scriptMode === "traditional" ? entry.exampleTraditional : entry.exampleSimplified;
  const speechLang = scriptMode === "traditional" ? "zh-TW" : "zh-CN";
  const fontSizeClass = useMemo(() => {
    const length = Array.from(headword).length;
    if (length >= 5) return "is-compact";
    if (length >= 3) return "is-medium";
    return "";
  }, [headword]);

  useEffect(() => {
    setShowStrokeOrder(false);
  }, [entry.id, scriptMode]);

  useEffect(() => {
    if (!revealed) return;
    const timeout = window.setTimeout(() => speak(headword, speechLang), 220);
    return () => window.clearTimeout(timeout);
  }, [revealed, headword, speechLang]);

  return (
    <section className="study-card" aria-label="Chinese vocabulary card">
      <p className="card-hint">Tap the fan to flip.</p>
      <div
        className={`fan ${revealed ? "is-revealed" : ""}`}
        role="button"
        tabIndex={0}
        onClick={onFlip}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          onFlip();
        }}
      >
        <span className="fan-ribs" aria-hidden="true" />
        {!revealed ? (
          <span className="fan-front">
            <span className={`hanzi-main ${fontSizeClass}`}>{headword}</span>
            <span className="fan-subtitle">{entry.theme}</span>
          </span>
        ) : (
          <span className="fan-back">
            <span className="translation">{entry.english}</span>
            <span className={`hanzi-answer ${fontSizeClass}`}>{headword}</span>
            <span className="pinyin">{entry.pinyin}</span>
            <span className="example-block">
              <span className="example-line">
                <span>{example}</span>
                <button
                  className="example-audio"
                  type="button"
                  aria-label="Listen to example"
                  title="Listen to example"
                  onClick={(event) => {
                    event.stopPropagation();
                    speak(example, speechLang);
                  }}
                >
                  <Volume2 size={13} aria-hidden="true" />
                </button>
              </span>
              <span className="example-translation">{entry.exampleEnglish}</span>
            </span>
          </span>
        )}
      </div>

      <div className="card-toolbar">
        <button className="secondary" type="button" onClick={onPrevious} disabled={!canGoPrevious}>
          Previous
        </button>
        <button className="secondary listen" type="button" onClick={() => speak(headword, speechLang)}>
          <Volume2 size={17} aria-hidden="true" />
          Listen
        </button>
        <button className="secondary" type="button" onClick={() => setShowStrokeOrder((current) => !current)}>
          <BookOpen size={17} aria-hidden="true" />
          Strokes
        </button>
      </div>

      <StrokeOrder character={headword} visible={showStrokeOrder} />

      {revealed && (
        <div className="review-actions">
          <button className="again" type="button" onClick={onAgain}>
            <RotateCcw size={18} aria-hidden="true" />
            Again
          </button>
          <button className="known" type="button" onClick={onKnown}>
            <Sparkles size={18} aria-hidden="true" />
            Known
          </button>
        </div>
      )}
    </section>
  );
}

export function speak(text: string, lang: string) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((candidate) => candidate.lang === lang) ??
    voices.find((candidate) => candidate.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));

  utterance.lang = voice?.lang ?? lang;
  utterance.voice = voice ?? null;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
