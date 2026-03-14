import { Tile } from "./Tile";

export class Board {
  readonly size: number;
  readonly tiles: Tile[][];
  readonly boardEl: HTMLElement;
  readonly overlayEl: SVGElement;

  constructor(letters: string[][], boardEl: HTMLElement, overlayEl: SVGElement) {
    this.size = letters.length;
    this.boardEl = boardEl;
    this.overlayEl = overlayEl;
    this.tiles = [];

    boardEl.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
    boardEl.innerHTML = "";

    // Scale font size for larger grids
    const fontSize = this.size <= 4 ? 2.4 : Math.max(1, 2.4 - (this.size - 4) * 0.25);
    boardEl.style.setProperty("--tile-font-size", `${fontSize}em`);

    for (let r = 0; r < this.size; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < this.size; c++) {
        const tile = new Tile(r, c, letters[r][c]);
        row.push(tile);
        boardEl.appendChild(tile.element);
      }
      this.tiles.push(row);
    }
  }

  getTile(r: number, c: number): Tile | null {
    if (r < 0 || r >= this.size || c < 0 || c >= this.size) return null;
    return this.tiles[r][c];
  }

  getTileFromElement(el: HTMLElement): Tile | null {
    const tileEl = el.closest(".tile") as HTMLElement | null;
    if (!tileEl || !tileEl.dataset.row) return null;
    return this.getTile(Number(tileEl.dataset.row), Number(tileEl.dataset.col));
  }

  getTileAtPoint(x: number, y: number): Tile | null {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    return this.getTileFromElement(el);
  }

  clearAllClasses(...classes: string[]) {
    for (const row of this.tiles) {
      for (const tile of row) {
        for (const cls of classes) {
          tile.removeClass(cls);
        }
      }
    }
  }

  drawPathLines(path: Tile[]) {
    this.overlayEl.innerHTML = "";
    if (path.length < 2) return;

    const ns = "http://www.w3.org/2000/svg";
    const overlayRect = this.overlayEl.getBoundingClientRect();

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i].center;
      const to = path[i + 1].center;

      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1", String(from.x - overlayRect.left));
      line.setAttribute("y1", String(from.y - overlayRect.top));
      line.setAttribute("x2", String(to.x - overlayRect.left));
      line.setAttribute("y2", String(to.y - overlayRect.top));
      line.setAttribute("stroke", "rgba(255, 255, 255, 0.85)");
      line.setAttribute("stroke-width", "3");
      line.setAttribute("stroke-linecap", "round");
      this.overlayEl.appendChild(line);
    }
  }

  clearPathLines() {
    this.overlayEl.innerHTML = "";
  }

  highlightPath(path: [number, number][]) {
    this.clearAllClasses("highlighted");
    const tiles: Tile[] = [];
    for (const [r, c] of path) {
      const tile = this.getTile(r, c);
      if (tile) {
        tile.addClass("highlighted");
        tiles.push(tile);
      }
    }
    this.drawPathLines(tiles);
  }

  clearHighlight() {
    this.clearAllClasses("highlighted");
    this.clearPathLines();
  }
}
