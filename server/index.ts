import express from "express";
import path from "path";
import { loadDictionary } from "./dictionary";
import { generateBoard } from "./board";
import { canTrace, solve, scoreWord } from "./solver";
import { initDb, logGame } from "./db";

const app = express();
app.use(express.json());

const dict = loadDictionary(path.join(__dirname, "..", "res", "words.txt"));
initDb().catch((err) => console.error("DB init failed:", err));

let currentBoard: string[][] = [];

app.post("/api/new", (req, res) => {
  const size = Math.min(Math.max(Number(req.body.size) || 4, 2), 10);
  currentBoard = generateBoard(size);
  const solved = solve(currentBoard, dict);
  const validWords = solved.map((s) => s.word);
  res.json({ board: currentBoard, validWords });
});

app.post("/api/validate", (req, res) => {
  const word = (req.body.word || "").toLowerCase().trim();
  if (word.length < 3) {
    return res.json({ valid: false, reason: "Word must be at least 3 letters" });
  }
  if (!dict.words.has(word)) {
    return res.json({ valid: false, reason: "Not in dictionary" });
  }
  if (!canTrace(currentBoard, word)) {
    return res.json({ valid: false, reason: "Cannot be traced on the board" });
  }
  res.json({ valid: true, score: scoreWord(word) });
});

app.post("/api/solve", (_req, res) => {
  const solved = solve(currentBoard, dict);
  const results = solved.map((s) => ({ word: s.word, path: s.path, score: scoreWord(s.word) }));
  const total = results.reduce((sum, r) => sum + r.score, 0);
  results.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));
  res.json({ words: results, total });
});

app.post("/api/game-end", async (req, res) => {
  const { foundWords, score, gridSize, duration } = req.body;
  const solved = solve(currentBoard, dict);
  const possibleScore = solved.reduce((sum, s) => sum + scoreWord(s.word), 0);

  logGame({
    ip: req.ip || "unknown",
    gridSize,
    duration,
    playerScore: score,
    possibleScore,
    wordsFound: foundWords || [],
    wordsTotal: solved.length,
    board: currentBoard,
  });

  res.json({ logged: true });
});

app.use(express.static(path.join(__dirname, "..", "client")));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Boggle server running at http://localhost:${PORT}`);

  // Self-ping every 10 minutes to prevent Render free tier spin-down
  if (process.env.RENDER_EXTERNAL_URL) {
    setInterval(() => {
      fetch(process.env.RENDER_EXTERNAL_URL!).catch(() => {});
    }, 10 * 60 * 1000);
  }
});
