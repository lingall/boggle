const LETTER_WEIGHTS: Record<string, number> = {
  a: 9, b: 2, c: 2, d: 4, e: 12, f: 2, g: 3, h: 2,
  i: 9, j: 1, k: 1, l: 4, m: 2, n: 6, o: 8, p: 2,
  q: 1, r: 6, s: 4, t: 6, u: 4, v: 2, w: 2, x: 1,
  y: 2, z: 1,
};

function weightedRandomLetter(): string {
  const entries = Object.entries(LETTER_WEIGHTS);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [letter, weight] of entries) {
    r -= weight;
    if (r <= 0) return letter;
  }
  return "e";
}

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

function isBalanced(board: string[][]): boolean {
  const total = board.length * board.length;
  const counts = new Map<string, number>();
  let vowelCount = 0;

  for (const row of board) {
    for (const letter of row) {
      counts.set(letter, (counts.get(letter) || 0) + 1);
      if (VOWELS.has(letter)) vowelCount++;
    }
  }

  // No single letter more than 30% of the board
  for (const count of counts.values()) {
    if (count / total > 0.3) return false;
  }

  // Vowels should be 30-50% of the board
  const vowelRatio = vowelCount / total;
  if (vowelRatio < 0.3 || vowelRatio > 0.5) return false;

  return true;
}

function makeBoard(size: number): string[][] {
  const board: string[][] = [];
  for (let r = 0; r < size; r++) {
    const row: string[] = [];
    for (let c = 0; c < size; c++) {
      row.push(weightedRandomLetter());
    }
    board.push(row);
  }
  return board;
}

export function generateBoard(size: number): string[][] {
  for (let attempt = 0; attempt < 20; attempt++) {
    const board = makeBoard(size);
    if (isBalanced(board)) return board;
  }
  return makeBoard(size);
}
