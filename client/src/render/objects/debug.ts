import * as PIXI from "pixi.js";
import { GridObject } from "./grid";
import { Vec2d } from "../../../../dogfight/src/physics/vector";

export class DebugView {
  public container: PIXI.Container;
  private cursorText: PIXI.Text;

  private grid: GridObject;

  private enabled: boolean = false;

  public constructor(renderer: PIXI.Renderer) {
    this.container = new PIXI.Container();
    this.grid = new GridObject(renderer);

    // cursor text
    this.cursorText = new PIXI.Text("", { fontSize: 24 });
    this.cursorText.position.set(5, 5);

    this.container.addChild(this.grid.container);
    this.container.addChild(this.cursorText);
    this.setEnabled(false);
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): void {
    this.setEnabled(!this.enabled);
    console.log("Debug mode", this.enabled ? "enabled" : "disabled");
  }

  public setCamera(x: number, y: number): void {
    this.grid.setCamera(x, y);
  }

  public setEnabled(active: boolean): void {
    this.grid.setEnabled(active);
    this.cursorText.visible = active;
    this.enabled = active;
  }

  public setCursorPos(gameCoords: Vec2d): void {
    // jconst dotCoords = this.grid.getDot(gameCoords);
    // this.grid.setDot(dotCoords);
    this.cursorText.text = "(" + gameCoords.x + ", " + gameCoords.y + ")";
  }
}
