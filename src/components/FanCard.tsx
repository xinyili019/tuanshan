import { ArrowLeft, BookOpen, ChevronDown, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { speakEntryAudio, speakText } from "../lib/audio";
import type { ScriptMode, StudyDirection, VocabEntry } from "../types";
import { StrokeOrder } from "./StrokeOrder";

interface FanCardProps {
  entry: VocabEntry;
  scriptMode: ScriptMode;
  studyDirection: StudyDirection;
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
  studyDirection,
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
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [hasSwappedCard, setHasSwappedCard] = useState(false);
  const fanRef = useRef<HTMLDivElement>(null);
  const headword = scriptMode === "traditional" ? entry.traditional : entry.simplified;
  const example = scriptMode === "traditional" ? entry.exampleTraditional : entry.exampleSimplified;
  const speechLang = scriptMode === "traditional" ? "zh-TW" : "zh-CN";
  const displayEnglish = getDisplayEnglish(entry);
  const backDensityClass =
    displayEnglish.length > 15 || entry.exampleEnglish.length > 44 || entry.examplePinyin.length > 38 ? "is-dense" : "";
  const backWeightClass =
    displayEnglish.length > 20 || (Array.from(headword).length >= 4 && entry.pinyin.length > 12) ? "is-heavy" : "";
  const exampleTranslationLines = splitExampleTranslation(entry.exampleEnglish);
  const exampleTranslationClass =
    exampleTranslationLines.length > 1
      ? entry.exampleEnglish.length >= 58
        ? "is-two-lines is-extra-long"
        : "is-two-lines"
      : "";
  const fontSizeClass = useMemo(() => {
    const length = Array.from(headword).length;
    if (length >= 5) return "is-compact";
    if (length >= 3) return "is-medium";
    return "";
  }, [headword]);
  const frontContent =
    studyDirection === "meaningHanzi" ? (
      <span className="fan-front-meaning">{displayEnglish}</span>
    ) : (
      <span className={`hanzi-main ${fontSizeClass}`}>{headword}</span>
    );

  useEffect(() => {
    setShowStrokeOrder(false);
    setShowExamplePinyin(false);
    setFirstWordTipDismissed(false);
  }, [entry.id, scriptMode]);

  useEffect(() => {
    if (!revealed) setShowStrokeOrder(false);
  }, [revealed]);

  function activateFan() {
    if (revealed || isAdvancing) return;
    if (!revealed && autoPlayAudio) void speakEntryAudio(entry, scriptMode, "word");
    onFlip();
  }

  function advanceWithFlip(onAdvance: () => void) {
    const fan = fanRef.current;
    if (!revealed || isAdvancing || !fan) return;

    setIsAdvancing(true);
    const animation = fan.animate(
      [
        { transform: "translateY(0) rotateY(180deg)" },
        { transform: "translateY(0) rotateY(360deg)" }
      ],
      {
        duration: 700,
        easing: "cubic-bezier(0.42, 0, 0.58, 1)"
      }
    );

    window.setTimeout(() => {
      setHasSwappedCard(true);
      onAdvance();
    }, 350);

    void animation.finished
      .catch(() => undefined)
      .finally(() => {
        setIsAdvancing(false);
        setHasSwappedCard(false);
      });
  }

  return (
    <section className="study-card" aria-label="Chinese vocabulary card">
      <p className="card-hint">Know this word? Tap the fan to check!</p>
      <div
        ref={fanRef}
        className={`fan ${revealed ? "is-revealed" : ""} ${isAdvancing ? "is-advancing" : ""} ${hasSwappedCard ? "has-swapped-card" : ""}`}
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
          <span className={`fan-front ${backWeightClass}`} aria-hidden={revealed}>
            {frontContent}
          </span>
          <span className={`fan-back ${backDensityClass} ${backWeightClass}`} aria-hidden={!revealed}>
            <span className="pinyin">{entry.pinyin}</span>
            <span className={`hanzi-answer ${fontSizeClass}`}>{headword}</span>
            <span className="fan-back-details">
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
                      void speakEntryAudio(entry, scriptMode, "example");
                    }}
                  >
                    <Volume2 size={13} aria-hidden="true" />
                  </button>
                </span>
                <span className={`example-translation ${exampleTranslationClass}`}>
                  {exampleTranslationLines.map((line, index) => (
                    <span key={`${index}-${line}`}>{line}</span>
                  ))}
                </span>
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
        </span>
        <span className="fan-ribs" aria-hidden="true" />
      </div>

      {showFirstWordTip && revealed && !firstWordTipDismissed && (
        <div className="first-word-tip" role="status" aria-live="polite">
          <p>
            Strokes shows how to write the character. Tap either Again or Known to move to the next word. Again means
            you’ll see it again soon; Known means it comes back later.
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
        <button className="secondary listen" type="button" onClick={() => void speakEntryAudio(entry, scriptMode, "word")}>
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
          <button className="again" type="button" onClick={() => advanceWithFlip(onAgain)} disabled={isAdvancing}>
            <RotateCcw size={18} aria-hidden="true" />
            Again
          </button>
          <button className="known" type="button" onClick={() => advanceWithFlip(onKnown)} disabled={isAdvancing}>
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

function splitExampleTranslation(translation: string) {
  if (translation === "Which item of clothing do you like?") {
    return ["Which item of clothing", "do you like?"];
  }

  if (translation.length < 36) return [translation];

  const words = translation.split(" ");
  let bestIndex = 1;
  let smallestDifference = Number.POSITIVE_INFINITY;

  for (let index = 1; index < words.length; index += 1) {
    const firstLength = words.slice(0, index).join(" ").length;
    const secondLength = words.slice(index).join(" ").length;
    const difference = Math.abs(firstLength - secondLength);
    if (difference < smallestDifference) {
      bestIndex = index;
      smallestDifference = difference;
    }
  }

  return [words.slice(0, bestIndex).join(" "), words.slice(bestIndex).join(" ")];
}

export const speak = speakText;
