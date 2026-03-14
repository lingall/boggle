import { Board } from "./Board";
import { Tile } from "./Tile";
import { scoreWord } from "./scoring";

export type WordResult = "valid" | "invalid" | "duplicate";

export class DragHandler {
  private board: Board;
  private isDragging = false;
  private selectedPath: Tile[] = [];
  private pendingClearTimeout: number | null = null;
  private wordPreview: HTMLElement;
  private onWordComplete: (word: string, path: Tile[]) => Promise<WordResult>;

  private validWords: Set<string> = new Set();
  private foundWords: Set<string> = new Set();
  private _enabled = false;

  constructor(
    board: Board,
    wordPreview: HTMLElement,
    onWordComplete: (word: string, path: Tile[]) => Promise<WordResult>
  ) {
    this.board = board;
    this.wordPreview = wordPreview;
    this.onWordComplete = onWordComplete;

    this.board.boardEl.addEventListener("pointerdown", this.onPointerDown);
    this.board.boardEl.addEventListener("pointermove", this.onPointerMove);
    this.board.boardEl.addEventListener("pointerup", this.onPointerUp);
  }

  setWordSets(validWords: Set<string>, foundWords: Set<string>) {
    this.validWords = validWords;
    this.foundWords = foundWords;
  }

  enable() { this._enabled = true; }
  disable() { this._enabled = false; }

  updateBoard(board: Board) {
    // Remove listeners from old board
    this.board.boardEl.removeEventListener("pointerdown", this.onPointerDown);
    this.board.boardEl.removeEventListener("pointermove", this.onPointerMove);
    this.board.boardEl.removeEventListener("pointerup", this.onPointerUp);

    this.board = board;

    // Add listeners to new board
    this.board.boardEl.addEventListener("pointerdown", this.onPointerDown);
    this.board.boardEl.addEventListener("pointermove", this.onPointerMove);
    this.board.boardEl.addEventListener("pointerup", this.onPointerUp);
  }

  private getSelectedWord(): string {
    return this.selectedPath.map((t) => t.letter).join("");
  }

  private isInPath(tile: Tile): boolean {
    return this.selectedPath.includes(tile);
  }

  private updateSelection() {
    const word = this.getSelectedWord().toLowerCase();
    const isDuplicate = word.length >= 3 && this.foundWords.has(word);
    const isValid = !isDuplicate && word.length >= 3 && this.validWords.has(word);

    for (const row of this.board.tiles) {
      for (const tile of row) {
        const inPath = this.isInPath(tile);
        tile.toggleClass("selected", inPath && !isValid && !isDuplicate);
        tile.toggleClass("path-valid", inPath && isValid);
        tile.toggleClass("path-duplicate", inPath && isDuplicate);
      }
    }

    if (this.selectedPath.length > 0) {
      this.wordPreview.classList.add("active");
      this.wordPreview.classList.toggle("preview-valid", isValid);
      this.wordPreview.classList.toggle("preview-duplicate", isDuplicate);
      if (isValid) {
        this.wordPreview.textContent = `${word} (+${scoreWord(word)})`;
      } else {
        this.wordPreview.textContent = word;
      }
    } else {
      this.wordPreview.classList.remove("active", "preview-valid", "preview-duplicate");
      this.wordPreview.textContent = "";
    }
  }

  private clearSelection() {
    this.selectedPath = [];
    this.isDragging = false;
    this.board.boardEl.classList.remove("dragging");
    this.updateSelection();
    this.wordPreview.classList.remove("active", "preview-valid", "preview-duplicate");
    this.wordPreview.textContent = "";
  }

  private cancelPendingClear() {
    if (this.pendingClearTimeout !== null) {
      clearTimeout(this.pendingClearTimeout);
      this.pendingClearTimeout = null;
    }
    this.wordPreview.classList.remove("preview-shake", "preview-invalid");
  }

  private flashPath(path: Tile[], type: WordResult) {
    const cls = `flash-${type}`;
    for (const tile of path) {
      tile.addClass(cls);
    }
    setTimeout(() => {
      for (const tile of path) {
        tile.addClass("flash-fade");
        tile.removeClass(cls);
      }
      setTimeout(() => {
        for (const tile of path) {
          tile.removeClass("flash-fade");
        }
      }, 150);
    }, 400);
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this._enabled) return;
    const tile = this.board.getTileFromElement(e.target as HTMLElement);
    if (!tile) return;
    e.preventDefault();
    this.board.boardEl.setPointerCapture(e.pointerId);

    this.cancelPendingClear();
    this.isDragging = true;
    this.board.boardEl.classList.add("dragging");
    this.selectedPath = [tile];
    this.updateSelection();
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDragging) return;
    const tile = this.board.getTileAtPoint(e.clientX, e.clientY);
    if (!tile) return;
    if (!tile.isNearCenter(e.clientX, e.clientY)) return;
    if (this.isInPath(tile)) return;

    const last = this.selectedPath[this.selectedPath.length - 1];
    if (last.isAdjacentTo(tile)) {
      this.selectedPath.push(tile);
      this.updateSelection();
    }
  };

  private onPointerUp = async (e: PointerEvent) => {
    if (!this.isDragging) return;
    this.board.boardEl.releasePointerCapture(e.pointerId);
    this.isDragging = false;

    const word = this.getSelectedWord();
    const path = [...this.selectedPath];

    if (word.length >= 3) {
      const result = await this.onWordComplete(word, path);
      this.flashPath(path, result);

      if (result === "invalid" || result === "duplicate") {
        this.wordPreview.classList.add("preview-shake");
        if (result === "invalid") {
          this.wordPreview.classList.add("preview-invalid");
        }
        this.pendingClearTimeout = window.setTimeout(() => {
          this.pendingClearTimeout = null;
          if (!this.isDragging) {
            this.wordPreview.classList.remove("preview-shake", "preview-invalid");
            this.clearSelection();
          }
        }, 400);
      } else {
        this.clearSelection();
      }
    } else {
      this.clearSelection();
    }
  };
}
