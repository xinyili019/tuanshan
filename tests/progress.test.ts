import { describe, expect, it } from "vitest";
import { createEmptyProgress, recordQuizCompleted } from "../src/lib/progress";
import { validateProgressState } from "../src/lib/storage.js";

describe("quiz progress", () => {
  it("accumulates first-attempt scores", () => {
    const first = recordQuizCompleted(createEmptyProgress(), undefined, { correctFirstTry: 7, total: 10 });
    const second = recordQuizCompleted(first, undefined, { correctFirstTry: 8, total: 10 });

    expect(second.session.quizCount).toBe(2);
    expect(second.session.quizFirstTryCorrect).toBe(15);
    expect(second.session.quizQuestions).toBe(20);
  });

  it("does not reset automatic quiz cadence after a manual quiz", () => {
    const progress = createEmptyProgress();
    progress.session.totalStudiedWords = 12;
    progress.session.studiedSinceQuizIds = ["one", "two"];

    const next = recordQuizCompleted(
      progress,
      undefined,
      { correctFirstTry: 2, total: 2 },
      { resetCadence: false }
    );

    expect(next.session.studiedSinceQuizIds).toEqual(["one", "two"]);
    expect(next.session.lastQuizAtStudiedCount).toBe(0);
  });

  it("migrates progress saved before cumulative quiz scores existed", () => {
    const legacy = createEmptyProgress();
    const { quizFirstTryCorrect: _correct, quizQuestions: _questions, ...legacySession } = legacy.session;
    const result = validateProgressState({ ...legacy, session: legacySession });

    expect(result.valid).toBe(true);
    expect(result.progress.session.quizFirstTryCorrect).toBe(0);
    expect(result.progress.session.quizQuestions).toBe(0);
  });
});
