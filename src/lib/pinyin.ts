const toneMap: Record<string, string> = {
  ā: "a1", á: "a2", ǎ: "a3", à: "a4",
  ē: "e1", é: "e2", ě: "e3", è: "e4",
  ī: "i1", í: "i2", ǐ: "i3", ì: "i4",
  ō: "o1", ó: "o2", ǒ: "o3", ò: "o4",
  ū: "u1", ú: "u2", ǔ: "u3", ù: "u4",
  ǖ: "v1", ǘ: "v2", ǚ: "v3", ǜ: "v4",
  ü: "v"
};

export function normalizePinyin(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, (char) => toneMap[char] ?? char)
    .replace(/u:/g, "v")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 v]/g, "");
}

export function isPinyinMatch(input: string, answer: string) {
  return normalizePinyin(input) === normalizePinyin(answer);
}
