import { ChevronDown, RotateCcw, Search, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { normalizePinyin } from "../lib/pinyin";
import { getProgressRecord } from "../lib/progress";
import type { ProgressState, ScriptMode, VocabEntry } from "../types";
import { speak } from "./FanCard";

interface BrowseUnit {
  id: string;
  title: string;
}

interface BrowseModeProps {
  entries: VocabEntry[];
  progress: ProgressState;
  scriptMode: ScriptMode;
  units: BrowseUnit[];
  onBack: () => void;
  onMarkForgotten: (id: string) => void;
}

export function BrowseMode({ entries, progress, scriptMode, units, onBack, onMarkForgotten }: BrowseModeProps) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; text: string } | null>(null);
  const speechLang = scriptMode === "traditional" ? "zh-TW" : "zh-CN";

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const groups = useMemo(() => {
    const filtered = filterEntries(entries, query);

    return units
      .map((unit) => {
        const unitEntries = entries.filter((entry) => entry.unit === unit.id);
        return {
          unit,
          entries: filtered.filter((entry) => entry.unit === unit.id),
          known: unitEntries.filter((entry) => getProgressRecord(progress, entry.id).status === "known").length,
          total: unitEntries.length
        };
      })
      .filter((group) => group.entries.length > 0);
  }, [entries, progress, query, units]);

  const resultCount = groups.reduce((count, group) => count + group.entries.length, 0);

  function handleForgotten(entry: VocabEntry) {
    onMarkForgotten(entry.id);
    setToast({ id: entry.id, text: `${getHeadword(entry, scriptMode)} marked Again` });
  }

  return (
    <section className="browse-panel" aria-label="Browse vocabulary">
      <div className="browse-toolbar">
        <button className="secondary back-button browse-back" type="button" onClick={onBack}>
          Back to study
        </button>
        <label className="browse-search">
          <span>Search vocabulary</span>
          <span className="browse-search-field">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Characters, pinyin, English"
            />
          </span>
        </label>
        <span className="browse-count" aria-live="polite">
          {resultCount} words
        </span>
      </div>

      <div className="browse-list" role="list">
        {groups.map((group) => (
          <section className="browse-unit" key={group.unit.id} aria-labelledby={`browse-unit-${group.unit.id}`}>
            <h2 className="browse-unit-header" id={`browse-unit-${group.unit.id}`}>
              {group.unit.title} — {group.known}/{group.total}
            </h2>
            <div className="browse-rows">
              {group.entries.map((entry) => {
                const headword = getHeadword(entry, scriptMode);
                const example = scriptMode === "traditional" ? entry.exampleTraditional : entry.exampleSimplified;
                const status = getProgressRecord(progress, entry.id).status;
                const isExpanded = expandedId === entry.id;

                return (
                  <article className={`browse-row${isExpanded ? " is-expanded" : ""}`} key={entry.id}>
                    <button
                      className="browse-row-summary"
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedId((current) => (current === entry.id ? null : entry.id))}
                    >
                      <span className="browse-word">{headword}</span>
                      <span className="browse-pinyin">{entry.pinyin}</span>
                      <span className="browse-english">{entry.english}</span>
                      <span className={`browse-status${status === "new" ? " is-blank" : ""}`}>
                        {formatStatus(status)}
                      </span>
                      <ChevronDown className="browse-chevron" size={18} aria-hidden="true" />
                    </button>

                    {isExpanded && (
                      <div className="browse-row-detail">
                        <div className="browse-example">
                          <span className="browse-example-line">{example}</span>
                          <span className="browse-example-pinyin">{entry.examplePinyin}</span>
                          <span className="browse-example-translation">{entry.exampleEnglish}</span>
                        </div>
                        <div className="browse-row-actions">
                          <button className="secondary" type="button" onClick={() => speak(example, speechLang)}>
                            <Volume2 size={17} aria-hidden="true" />
                            Play audio
                          </button>
                          {status === "known" && (
                            <button className="again" type="button" onClick={() => handleForgotten(entry)}>
                              <RotateCcw size={17} aria-hidden="true" />
                              Mark as forgotten
                            </button>
                          )}
                        </div>
                        {toast?.id === entry.id && (
                          <p className="browse-toast" role="status" aria-live="polite">
                            {toast.text}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        {resultCount === 0 && (
          <div className="browse-empty" role="status">
            No matching words.
          </div>
        )}
      </div>
    </section>
  );
}

function filterEntries(entries: VocabEntry[], query: string) {
  const trimmed = query.trim();
  if (!trimmed) return entries;

  const scriptNeedle = normalizePlain(trimmed);
  const pinyinNeedle = normalizePinyin(trimmed).replace(/\s/g, "");

  return entries.filter((entry) => {
    const simplified = normalizePlain(entry.simplified);
    const traditional = normalizePlain(entry.traditional);
    const english = normalizePlain(entry.english);
    const pinyin = normalizePinyin(entry.pinyin).replace(/\s/g, "");

    return (
      simplified.includes(scriptNeedle) ||
      traditional.includes(scriptNeedle) ||
      english.includes(scriptNeedle) ||
      (pinyinNeedle.length > 0 && pinyin.includes(pinyinNeedle))
    );
  });
}

function normalizePlain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getHeadword(entry: VocabEntry, scriptMode: ScriptMode) {
  return scriptMode === "traditional" ? entry.traditional : entry.simplified;
}

function formatStatus(status: "new" | "again" | "known") {
  if (status === "known") return "✓ Known";
  if (status === "again") return "↻ Again";
  return "";
}
