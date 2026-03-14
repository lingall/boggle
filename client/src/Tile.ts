export class Tile {
  readonly row: number;
  readonly col: number;
  readonly letter: string;
  readonly element: HTMLDivElement;

  constructor(row: number, col: number, letter: string) {
    this.row = row;
    this.col = col;
    this.letter = letter;

    this.element = document.createElement("div");
    this.element.className = "tile";
    this.element.textContent = letter;
    this.element.dataset.row = String(row);
    this.element.dataset.col = String(col);
  }

  addClass(cls: string) {
    this.element.classList.add(cls);
  }

  removeClass(cls: string) {
    this.element.classList.remove(cls);
  }

  toggleClass(cls: string, force: boolean) {
    this.element.classList.toggle(cls, force);
  }

  isAdjacentTo(other: Tile): boolean {
    return (
      Math.abs(this.row - other.row) <= 1 &&
      Math.abs(this.col - other.col) <= 1 &&
      !(this.row === other.row && this.col === other.col)
    );
  }

  get center(): { x: number; y: number } {
    const rect = this.element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  isNearCenter(clientX: number, clientY: number): boolean {
    const rect = this.element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < rect.width * 0.4;
  }
}
