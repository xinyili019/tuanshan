import { ArrowRight, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { speakEntryAudio } from "../lib/audio";
import { buildQuizQuestions, getHeadword, reinsertQuestion } from "../lib/quiz";
import type { QuizQuestion, QuizResult, ScriptMode, VocabEntry } from "../types";

interface QuizProps {
  entries: VocabEntry[];
  allEntries: VocabEntry[];
  scriptMode: ScriptMode;
  onContinue: (result: QuizResult) => void;
  continueLabel?: string;
}

interface Feedback {
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
}

export function Quiz({ entries, allEntries, scriptMode, onContinue, continueLabel = "Continue" }: QuizProps) {
  const [queue, setQueue] = useState<QuizQuestion[]>(() => buildQuizQuestions(entries, allEntries, scriptMode));
  const [questionCount, setQuestionCount] = useState(queue.length);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(() => new Set());
  const [retriedQuestionIds, setRetriedQuestionIds] = useState<Set<string>>(() => new Set());
  const [firstTryCorrectIds, setFirstTryCorrectIds] = useState<Set<string>>(() => new Set());
  const [missedEntryIds, setMissedEntryIds] = useState<Set<string>>(() => new Set());
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const didMountRef = useRef(false);
  const lastAutoPlayedQuestionRef = useRef<string | null>(null);
  const active = queue[0];
  const activeHeadword = active ? getHeadword(active.entry, scriptMode) : "";

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const questions = buildQuizQuestions(entries, allEntries, scriptMode);
    setQueue(questions);
    setQuestionCount(questions.length);
    setAnsweredQuestionIds(new Set());
    setRetriedQuestionIds(new Set());
    setFirstTryCorrectIds(new Set());
    setMissedEntryIds(new Set());
    setFeedback(null);
    lastAutoPlayedQuestionRef.current = null;
  }, [allEntries, entries, scriptMode]);

  useEffect(() => {
    if (!active || active.mode !== "audioMeaning" || feedback) return;
    if (lastAutoPlayedQuestionRef.current === active.id) return;
    lastAutoPlayedQuestionRef.current = active.id;
    void speakEntryAudio(active.entry, scriptMode, "word");
  }, [active, feedback, scriptMode]);

  useEffect(() => {
    if (!active || active.mode !== "sentenceCloze" || feedback) return;
    if (lastAutoPlayedQuestionRef.current === active.id) return;
    lastAutoPlayedQuestionRef.current = active.id;
    void speakEntryAudio(active.entry, scriptMode, "example");
  }, [active, feedback, scriptMode]);

  const result = useMemo<QuizResult>(() => {
    const missedEntries = entries.filter((entry) => missedEntryIds.has(entry.id));
    const correctFirstTry = firstTryCorrectIds.size;
    return {
      accuracy: questionCount ? correctFirstTry / questionCount : 1,
      correctFirstTry,
      total: questionCount,
      missedEntries
    };
  }, [entries, firstTryCorrectIds, missedEntryIds, questionCount]);

  if (!active) {
    return (
      <section className="quiz-panel fan-panel" aria-label="Quiz results">
        <p className="eyebrow">Quiz results</p>
        <h2>{Math.round(result.accuracy * 100)}% first try</h2>
        <p className="quiz-result-summary">
          {result.correctFirstTry}/{result.total} correct on the first attempt
        </p>

        {result.missedEntries.length > 0 ? (
          <div className="quiz-missed-list">
            <p className="eyebrow">Practiced once · Marked Again</p>
            <div>
              {result.missedEntries.map((entry) => (
                <span className="quiz-missed-word" key={entry.id}>
                  <span>{getHeadword(entry, scriptMode)}</span>
                  <span>{entry.english}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="quiz-result-summary">No missed words.</p>
        )}

        <button className="primary" type="button" onClick={() => onContinue(result)}>
          {continueLabel}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>
    );
  }

  const completed = questionCount - queue.length;
  const progress = questionCount ? Math.min(100, (completed / questionCount) * 100) : 0;
  const isAudioQuestion = active.mode === "audioMeaning";

  function answer(optionId: string) {
    if (!active || feedback) return;

    const correct = optionId === active.correctOptionId;
    const firstAttempt = !answeredQuestionIds.has(active.id);
    const nextFeedback = { questionId: active.id, selectedOptionId: optionId, correct };

    setFeedback(nextFeedback);
    setAnsweredQuestionIds((current) => new Set(current).add(active.id));
    if (firstAttempt && correct) setFirstTryCorrectIds((current) => new Set(current).add(active.id));
    if (!correct) setMissedEntryIds((current) => new Set(current).add(active.entry.id));
  }

  function advance() {
    if (!feedback) return;
    const shouldRetry = !feedback.correct && !retriedQuestionIds.has(feedback.questionId);

    setQueue((current) => {
      const [currentQuestion, ...rest] = current;
      if (!currentQuestion) return current;
      if (currentQuestion.id !== feedback.questionId) return current;
      if (feedback.correct) return rest;
      return shouldRetry ? reinsertQuestion(rest, currentQuestion) : rest;
    });
    if (shouldRetry) setRetriedQuestionIds((currentIds) => new Set(currentIds).add(feedback.questionId));
    setFeedback(null);
  }

  return (
    <section className="quiz-panel fan-panel" aria-label="Quiz">
      <div className="quiz-topline">
        <p className="eyebrow">{isAudioQuestion ? "Audio" : "Sentence"}</p>
        <span>{completed}/{questionCount}</span>
      </div>

      <div className="progress-line quiz-progress" aria-label="Quiz progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      {isAudioQuestion ? (
        <div className="quiz-audio-cue">
          <button
            className="quiz-listen-button"
            type="button"
            onClick={() => void speakEntryAudio(active.entry, scriptMode, "word")}
          >
            <Volume2 size={26} aria-hidden="true" />
            Replay
          </button>
          <p>Choose the meaning</p>
        </div>
      ) : (
        <div className="quiz-cloze-cue">
          <p className="quiz-cloze-line">{active.prompt}</p>
          {active.context && <p className="quiz-context">{active.context}</p>}
          <button className="secondary quiz-sentence-audio" type="button" onClick={() => void speakEntryAudio(active.entry, scriptMode, "example")}>
            <Volume2 size={16} aria-hidden="true" />
            Replay sentence
          </button>
        </div>
      )}

      <div className={`quiz-options ${isAudioQuestion ? "has-four" : "has-three"}`}>
        {active.options.map((option) => {
          const isSelected = feedback?.selectedOptionId === option.id;
          const isCorrect = option.id === active.correctOptionId;
          const className = [
            "quiz-option",
            feedback && isCorrect ? "is-correct" : "",
            feedback && isSelected && !isCorrect ? "is-incorrect" : ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              className={className}
              type="button"
              key={option.id}
              onClick={() => answer(option.id)}
              disabled={Boolean(feedback)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className={`quiz-feedback ${feedback.correct ? "is-correct" : "is-incorrect"}`} aria-live="polite">
          <span>{feedback.correct ? "Correct" : "Try it again"}</span>
          <span className="quiz-answer-reveal">
            {activeHeadword} · {active.entry.pinyin} · {active.entry.english}
          </span>
          <button className="primary quiz-next-button" type="button" onClick={advance}>
            Next
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}

      {!isAudioQuestion && feedback && (
        <button
          className="secondary quiz-replay-small"
          type="button"
          onClick={() => void speakEntryAudio(active.entry, scriptMode, "word")}
        >
          <RotateCcw size={16} aria-hidden="true" />
          Replay word
        </button>
      )}
    </section>
  );
}
