import * as PIXI from "pixi.js";
import { GridObject } from "./grid";

export class DebugView {
  public container: PIXI.Container;
  private cursorText: PIXI.Text;

  private grid: GridObject;

  private enabled: boolean = false;

  public constructor(renderer: PIXI.Renderer) {
    this.container = new PIXI.Container();
    this.grid = new GridObject(renderer);

    // cursor text
    this.cursorText = new PIXI.Text("", { fontSize: 20 });
    this.cursorText.position.set(5, 5);

    this.container.addChild(this.grid.container);
    this.container.addChild(this.cursorText);
  }

  public toggle(): void {
    this.setEnabled(!this.enabled);
  }

  public setEnabled(active: boolean): void {
    this.grid.setEnabled(active);
    this.cursorText.visible = active;
    this.enabled = active;
  }

  public setCursorPos(x: number, y: number): void {
    this.cursorText.text = "(" + x + ", " + y + ")";
  }
}
