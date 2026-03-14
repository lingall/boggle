import { Dictionary } from "./dictionary";

export function canTrace(board: string[][], word: string): boolean {
  const size = board.length;
  const visited = Array.from({ length: size }, () => Array(size).fill(false));

  function dfs(r: number, c: number, idx: number): boolean {
    if (idx === word.length) return true;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    if (visited[r][c]) return false;
    if (board[r][c] !== word[idx]) return false;

    visited[r][c] = true;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (dfs(r + dr, c + dc, idx + 1)) return true;
      }
    }
    visited[r][c] = false;
    return false;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (dfs(r, c, 0)) return true;
    }
  }
  return false;
}

export function solve(
  board: string[][],
  dict: Dictionary
): { word: string; path: [number, number][] }[] {
  const size = board.length;
  const found = new Map<string, [number, number][]>();
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const maxLen = size * size;
  const currentPath: [number, number][] = [];

  function dfs(r: number, c: number, prefix: string) {
    if (prefix.length > maxLen) return;
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    if (visited[r][c]) return;

    const current = prefix + board[r][c];

    if (!dict.prefixes.has(current)) return;

    visited[r][c] = true;
    currentPath.push([r, c]);

    if (current.length >= 3 && dict.words.has(current) && !found.has(current)) {
      found.set(current, [...currentPath]);
    }

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        dfs(r + dr, c + dc, current);
      }
    }

    currentPath.pop();
    visited[r][c] = false;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      dfs(r, c, "");
    }
  }

  return Array.from(found.entries()).map(([word, p]) => ({ word, path: p }));
}

const SCORES = [0, 0, 0, 100, 200, 300, 500, 800, 1200, 1700, 2500, 3500, 5000, 6500, 7500, 8000];

export function scoreWord(word: string): number {
  const len = Math.min(word.length, SCORES.length - 1);
  return SCORES[len];
}
