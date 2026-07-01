const toneMap: Record<string, string> = {
  ā: "a", á: "a", ǎ: "a", à: "a",
  ē: "e", é: "e", ě: "e", è: "e",
  ī: "i", í: "i", ǐ: "i", ì: "i",
  ō: "o", ó: "o", ǒ: "o", ò: "o",
  ū: "u", ú: "u", ǔ: "u", ù: "u",
  ǖ: "u", ǘ: "u", ǚ: "u", ǜ: "u",
  ü: "u"
};

export function normalizePinyin(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, (char) => toneMap[char] ?? char)
    .replace(/u:/g, "u")
    .replace(/v/g, "u")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");
}

export function isPinyinMatch(input: string, answer: string) {
  return normalizePinyin(input).replace(/\s/g, "") === normalizePinyin(answer).replace(/\s/g, "");
}
