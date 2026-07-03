import { ArrowLeft, BookOpen, ChevronDown, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ScriptMode, VocabEntry } from "../types";
import { StrokeOrder } from "./StrokeOrder";

interface FanCardProps {
  entry: VocabEntry;
  scriptMode: ScriptMode;
  revealed: boolean;
  canGoPrevious: boolean;
  showFirstWordTip?: boolean;
  autoPlayAudio: boolean;
  onFlip: () => void;
  onPrevious: () => void;
  onGoBack?: () => void;
  onAgain: () => void;
  onKnown: () => void;
}

export function FanCard({
  entry,
  scriptMode,
  revealed,
  canGoPrevious,
  showFirstWordTip = false,
  autoPlayAudio,
  onFlip,
  onPrevious,
  onGoBack,
  onAgain,
  onKnown
}: FanCardProps) {
  const [showStrokeOrder, setShowStrokeOrder] = useState(false);
  const [showExamplePinyin, setShowExamplePinyin] = useState(false);
  const [firstWordTipDismissed, setFirstWordTipDismissed] = useState(false);
  const headword = scriptMode === "traditional" ? entry.traditional : entry.simplified;
  const example = scriptMode === "traditional" ? entry.exampleTraditional : entry.exampleSimplified;
  const speechLang = scriptMode === "traditional" ? "zh-TW" : "zh-CN";
  const displayEnglish = getDisplayEnglish(entry);
  const fontSizeClass = useMemo(() => {
    const length = Array.from(headword).length;
    if (length >= 5) return "is-compact";
    if (length >= 3) return "is-medium";
    return "";
  }, [headword]);

  useEffect(() => {
    setShowStrokeOrder(false);
    setShowExamplePinyin(false);
    setFirstWordTipDismissed(false);
  }, [entry.id, scriptMode]);

  useEffect(() => {
    if (!revealed) setShowStrokeOrder(false);
  }, [revealed]);

  function activateFan() {
    if (!revealed && autoPlayAudio) speak(headword, speechLang);
    onFlip();
  }

  return (
    <section className="study-card" aria-label="Chinese vocabulary card">
      <p className="card-hint">Know this word? Tap the fan to check!</p>
      <div
        className={`fan ${revealed ? "is-revealed" : ""}`}
        role="button"
        tabIndex={0}
        onClick={activateFan}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          activateFan();
        }}
      >
        <span className="fan-inner">
          <span className="fan-front" aria-hidden={revealed}>
            <span className={`hanzi-main ${fontSizeClass}`}>{headword}</span>
          </span>
          <span className="fan-back" aria-hidden={!revealed}>
            <span className="pinyin">{entry.pinyin}</span>
            <span className={`hanzi-answer ${fontSizeClass}`}>{headword}</span>
            <span className="translation">{displayEnglish}</span>
            <span className="example-block">
              <span className="example-line">
                <span className="example-text">{example}</span>
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
              <details
                className="example-toggle"
                open={showExamplePinyin}
                onClick={(event) => event.stopPropagation()}
                onToggle={(event) => {
                  event.stopPropagation();
                  setShowExamplePinyin((event.currentTarget as HTMLDetailsElement).open);
                }}
              >
                <summary>
                  <ChevronDown className="example-chevron" size={14} aria-hidden="true" />
                  Pinyin
                </summary>
                <span className="example-pinyin">{entry.examplePinyin}</span>
              </details>
            </span>
          </span>
        </span>
        <span className="fan-ribs" aria-hidden="true" />
      </div>

      {showFirstWordTip && revealed && !firstWordTipDismissed && (
        <div className="first-word-tip" role="status" aria-live="polite">
          <p>
            Strokes shows how to write the character. Again saves this word for review and pinyin recall. Known moves
            on.
          </p>
          <button className="primary first-word-tip-dismiss" type="button" onClick={() => setFirstWordTipDismissed(true)}>
            Got it
          </button>
        </div>
      )}

      {revealed && onGoBack && (
        <button className="secondary back-button review-back-floating" type="button" onClick={onGoBack}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back
        </button>
      )}

      <div className="card-toolbar">
        <button className="secondary" type="button" onClick={onPrevious} disabled={!canGoPrevious}>
          Previous
        </button>
        <button className="secondary listen" type="button" onClick={() => speak(headword, speechLang)}>
          <Volume2 size={17} aria-hidden="true" />
          Listen
        </button>
        {revealed && (
          <button className="secondary" type="button" onClick={() => setShowStrokeOrder((current) => !current)}>
            <BookOpen size={17} aria-hidden="true" />
            Strokes
          </button>
        )}
      </div>

      <StrokeOrder character={headword} visible={revealed && showStrokeOrder} />

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

function getDisplayEnglish(entry: VocabEntry) {
  const byWord: Record<string, string> = {
    "我": "I / me",
    "你": "you",
    "您": "you (polite)",
    "他": "he / him",
    "她": "she / her",
    "我们": "we / us",
    "我們": "we / us",
    "你们": "you (plural)",
    "你們": "you (plural)"
  };

  return byWord[entry.simplified] ?? byWord[entry.traditional] ?? entry.english;
}

export function speak(text: string, lang: string) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const voice = pickMandarinVoice(voices, lang);

  utterance.lang = voice?.lang ?? lang;
  utterance.voice = voice ?? null;
  utterance.rate = 0.92;
  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  window.speechSynthesis.speak(utterance);
}

function pickMandarinVoice(voices: SpeechSynthesisVoice[], lang: string) {
  const mandarinCandidates = voices.filter((voice) => /^zh/i.test(voice.lang) || /mandarin|putonghua|chinese/i.test(voice.name));

  const rank = (voice: SpeechSynthesisVoice) => {
    const normalizedLang = voice.lang.toLowerCase();
    const normalizedName = voice.name.toLowerCase();
    let score = 0;

    if (normalizedLang === "zh-cn" || normalizedLang.startsWith("zh-hans")) score += 100;
    if (normalizedLang.startsWith("zh-sg")) score += 80;
    if (normalizedLang.startsWith("zh")) score += 60;
    if (normalizedLang.startsWith(lang.toLowerCase())) score += 40;
    if (normalizedName.includes("mandarin")) score += 30;
    if (normalizedName.includes("putonghua")) score += 25;
    if (normalizedName.includes("standard")) score += 10;
    if (normalizedName.includes("taiwan") || normalizedName.includes("cantonese")) score -= 40;

    return score;
  };

  const pool = mandarinCandidates.length ? mandarinCandidates : voices;
  return pool.reduce<SpeechSynthesisVoice | null>((best, voice) => {
    if (!best) return voice;
    return rank(voice) > rank(best) ? voice : best;
  }, null);
}
