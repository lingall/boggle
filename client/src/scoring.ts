const SCORES = [0, 0, 0, 100, 200, 300, 500, 800, 1200, 1700, 2500, 3500, 5000, 6500, 7500, 8000];

export function scoreWord(word: string): number {
  const len = Math.min(word.length, SCORES.length - 1);
  return SCORES[len];
}
