import { api } from "./api";
import { Board } from "./Board";
import { Timer } from "./Timer";
import { DragHandler, WordResult } from "./DragHandler";

export class Game {
  board!: Board;
  score = 0;
  foundWords = new Set<string>();
  validWords = new Set<string>();
  timer: Timer;
  dragHandler!: DragHandler;

  private boardEl: HTMLElement;
  private overlayEl: SVGElement;
  private wordPreview: HTMLElement;
  private scoreDisplay: HTMLElement;
  private foundWordsList: HTMLElement;
  private onGameEnd: () => void;

  constructor(opts: {
    boardEl: HTMLElement;
    overlayEl: SVGElement;
    wordPreview: HTMLElement;
    scoreDisplay: HTMLElement;
    foundWordsList: HTMLElement;
    timerDisplay: HTMLElement;
    onGameEnd: () => void;
  }) {
    this.boardEl = opts.boardEl;
    this.overlayEl = opts.overlayEl;
    this.wordPreview = opts.wordPreview;
    this.scoreDisplay = opts.scoreDisplay;
    this.foundWordsList = opts.foundWordsList;
    this.onGameEnd = opts.onGameEnd;

    this.timer = new Timer();

    // Create initial empty board
    this.board = new Board([], this.boardEl, this.overlayEl);

    this.dragHandler = new DragHandler(
      this.board,
      this.wordPreview,
      (word, _path) => this.submitWord(word)
    );
  }

  async start(size: number, duration: number, onTick: (secondsLeft: number) => void) {
    const data = await api("new", { size });

    this.board = new Board(data.board, this.boardEl, this.overlayEl);
    this.validWords = new Set(data.validWords);
    this.foundWords = new Set();
    this.score = 0;

    this.dragHandler.updateBoard(this.board);
    this.dragHandler.setWordSets(this.validWords, this.foundWords);
    this.dragHandler.enable();

    this.scoreDisplay.textContent = "Score: 0";
    this.foundWordsList.innerHTML = "";
    this.wordPreview.textContent = "";
    this.wordPreview.classList.remove("active", "preview-valid", "preview-duplicate");

    this.timer.start(duration, onTick, () => this.endGame());
  }

  private async submitWord(word: string): Promise<WordResult> {
    word = word.toLowerCase().trim();
    if (!word) return "invalid";

    if (this.foundWords.has(word)) {
      return "duplicate";
    }

    const data = await api("validate", { word });
    if (data.valid) {
      this.foundWords.add(word);
      this.score += data.score;
      this.scoreDisplay.textContent = `Score: ${this.score}`;

      const li = document.createElement("li");
      li.textContent = `${word} (+${data.score})`;
      this.foundWordsList.appendChild(li);

      // Update drag handler's reference to foundWords
      this.dragHandler.setWordSets(this.validWords, this.foundWords);

      return "valid";
    } else {
      return "invalid";
    }
  }

  async endGame() {
    this.timer.stop();
    this.dragHandler.disable();
    this.onGameEnd();
  }

  async getSolveResults() {
    return api("solve", {});
  }
}
