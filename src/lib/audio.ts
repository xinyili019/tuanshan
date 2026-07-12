import type { ScriptMode, VocabEntry } from "../types";

type AudioKind = "word" | "example";

let currentAudio: HTMLAudioElement | null = null;

export function getHeadword(entry: VocabEntry, scriptMode: ScriptMode) {
  return scriptMode === "traditional" ? entry.traditional : entry.simplified;
}

export async function speakEntryAudio(entry: VocabEntry, scriptMode: ScriptMode, kind: AudioKind = "word") {
  const text =
    kind === "example"
      ? scriptMode === "traditional"
        ? entry.exampleTraditional
        : entry.exampleSimplified
      : getHeadword(entry, scriptMode);
  const lang = scriptMode === "traditional" ? "zh-TW" : "zh-CN";
  const audioFolder = kind === "example" ? "examples" : "words";
  const src = new URL(`audio/${audioFolder}/${entry.id}.mp3`, document.baseURI).toString();

  try {
    await playStaticAudio(src);
  } catch {
    speakText(text, lang);
  }
}

export function speakText(text: string, lang: string) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;

  currentAudio?.pause();
  currentAudio = null;

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

function playStaticAudio(src: string) {
  return new Promise<void>((resolve, reject) => {
    window.speechSynthesis?.cancel();
    currentAudio?.pause();

    const audio = new Audio(src);
    currentAudio = audio;
    audio.addEventListener("ended", () => resolve(), { once: true });
    audio.addEventListener("error", () => reject(new Error(`Could not play ${src}`)), { once: true });
    audio.play().catch(reject);
  });
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
