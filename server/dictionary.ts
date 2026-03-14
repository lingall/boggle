import fs from "fs";

export interface Dictionary {
  words: Set<string>;
  prefixes: Set<string>;
}

export function loadDictionary(filePath: string): Dictionary {
  const words = new Set<string>();
  const prefixes = new Set<string>();

  const raw = fs.readFileSync(filePath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const word = line.trim().toLowerCase();
    if (word.length >= 3 && /^[a-z]+$/.test(word)) {
      words.add(word);
      for (let i = 1; i <= word.length; i++) {
        prefixes.add(word.substring(0, i));
      }
    }
  }

  console.log(`Dictionary loaded: ${words.size} words, ${prefixes.size} prefixes`);
  return { words, prefixes };
}
