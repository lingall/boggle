import { Game } from "./Game";

// --- DOM elements ---

const setupDiv = document.getElementById("setup")!;
const gameDiv = document.getElementById("game")!;
const resultsDiv = document.getElementById("results")!;
const boardContainer = document.getElementById("board-container")!;
const resultsBoardSlot = document.getElementById("results-board-slot")!;
const resultsLists = document.getElementById("results-lists")!;
const boardWrapper = document.getElementById("board-wrapper")!;
const containerEl = document.getElementById("container")!;

const gridSizeInput = document.getElementById("grid-size") as HTMLInputElement;
const timerDurationInput = document.getElementById("timer-duration") as HTMLInputElement;
const newGameBtn = document.getElementById("new-game")!;

const timerDisplay = document.getElementById("timer")!;
const boardEl = document.getElementById("board")!;
const overlayEl = document.getElementById("path-overlay") as unknown as SVGElement;
const wordPreview = document.getElementById("word-preview")!;
const scoreDisplay = document.getElementById("score")!;
const foundWordsList = document.getElementById("found-words")!;
const giveUpBtn = document.getElementById("give-up")!;

const yourScoreSpan = document.getElementById("your-score")!;
const yourWordsList = document.getElementById("your-words-list")!;
const allWordsList = document.getElementById("all-words-list")!;
const possibleCountSpan = document.getElementById("possible-count")!;
const playAgainBtn = document.getElementById("play-again")!;

// --- Game instance ---

const game = new Game({
  boardEl,
  overlayEl,
  wordPreview,
  scoreDisplay,
  foundWordsList,
  timerDisplay,
  onGameEnd: () => endGame(),
});

// --- Screen management ---

function showScreen(screen: "setup" | "game" | "results") {
  setupDiv.classList.toggle("hidden", screen !== "setup");
  gameDiv.classList.toggle("hidden", screen !== "game");
  resultsDiv.classList.toggle("hidden", screen !== "results");
  boardContainer.classList.toggle("hidden", screen === "setup");

  if (screen === "results") {
    resultsBoardSlot.appendChild(boardContainer);
    containerEl.classList.add("wide");
    requestAnimationFrame(() => {
      const wordsHeight = resultsLists.offsetHeight;
      boardWrapper.style.width = wordsHeight + "px";
      boardWrapper.style.maxWidth = "100%";
    });
  } else {
    containerEl.insertBefore(boardContainer, gameDiv);
    containerEl.classList.remove("wide");
    boardWrapper.style.width = "";
    boardWrapper.style.maxWidth = "";
  }
}

function updateTimerDisplay(secondsLeft: number) {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  timerDisplay.textContent = `${m}:${s.toString().padStart(2, "0")}`;
  timerDisplay.classList.toggle("warning", secondsLeft <= 30 && secondsLeft > 0);
}

// --- Game flow ---

async function startGame() {
  const size = parseInt(gridSizeInput.value) || 4;
  const duration = parseInt(timerDurationInput.value) || 180;

  showScreen("game");
  await game.start(size, duration, updateTimerDisplay);
}

async function endGame() {
  const data = await game.getSolveResults();

  yourScoreSpan.textContent = String(game.score);

  // Build lookups from full results
  const wordData = new Map<string, { score: number; path: [number, number][] }>();
  for (const { word: w, score: s, path: p } of data.words) {
    wordData.set(w, { score: s, path: p });
  }

  possibleCountSpan.textContent = String(data.words.length);

  // Your words (sorted by score descending)
  yourWordsList.innerHTML = "";
  const sortedFound = [...game.foundWords].sort((a, b) => {
    const sa = wordData.get(a)?.score || 0;
    const sb = wordData.get(b)?.score || 0;
    return sb - sa || a.localeCompare(b);
  });
  for (const word of sortedFound) {
    const li = document.createElement("li");
    const wd = wordData.get(word);
    li.textContent = `${word} (${wd?.score || 0})`;
    li.className = "found";
    if (wd) {
      li.addEventListener("mouseenter", () => game.board.highlightPath(wd.path));
      li.addEventListener("mouseleave", () => game.board.clearHighlight());
    }
    yourWordsList.appendChild(li);
  }

  // All possible words
  allWordsList.innerHTML = "";
  for (const { word, score: pts, path } of data.words) {
    const li = document.createElement("li");
    li.textContent = `${word} (${pts})`;
    if (game.foundWords.has(word)) li.className = "found";
    li.addEventListener("mouseenter", () => game.board.highlightPath(path));
    li.addEventListener("mouseleave", () => game.board.clearHighlight());
    allWordsList.appendChild(li);
  }

  showScreen("results");
}

// --- Event listeners ---

newGameBtn.addEventListener("click", startGame);
giveUpBtn.addEventListener("click", () => game.endGame());
playAgainBtn.addEventListener("click", () => showScreen("setup"));
