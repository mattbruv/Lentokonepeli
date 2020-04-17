import * as PIXI from "pixi.js";
import { GridObject } from "./grid";
import { Vec2d } from "../../../../dogfight/src/physics/vector";
import { toPixiCoords } from "../coords";

const DOT_SIZE = 5;
const DOT_COLOR = 0x666666;

export class DebugView {
  public gameContainer: PIXI.Container;
  public worldContainer: PIXI.Container;
  private cursorText: PIXI.Text;

  private grid: GridObject;
  private dot: PIXI.Graphics;

  private enabled: boolean = false;
  private showGrid: boolean = true;

  public constructor(renderer: PIXI.Renderer) {
    this.worldContainer = new PIXI.Container();
    this.gameContainer = new PIXI.Container();
    this.grid = new GridObject(renderer);

    this.dot = new PIXI.Graphics();
    this.dot.beginFill(DOT_COLOR);
    this.dot.drawCircle(0, 0, DOT_SIZE);
    this.dot.endFill();

    // cursor text
    this.cursorText = new PIXI.Text("", { fontSize: 24 });
    this.cursorText.position.set(5, 5);

    this.gameContainer.addChild(this.grid.container);
    this.gameContainer.addChild(this.cursorText);

    this.worldContainer.addChild(this.dot);

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
    this.dot.visible = active;
    this.worldContainer.visible = active;
    this.enabled = active;
  }

  public resetZoom(): void {
    this.grid.gridSprite.tileScale.set(1);
    this.grid.axisSprite.scale.set(1);
    this.grid.gridSprite.pivot.set(0);
    this.grid.axisSprite.pivot.set(0);
  }

  public zoom(factor: number): void {
    this.grid.gridSprite.tileScale.x *= factor;
    this.grid.gridSprite.tileScale.y *= factor;
    this.grid.axisSprite.scale.x *= factor;
    this.grid.axisSprite.scale.y *= factor;
  }

  // returns corner to snap dot to, or nothing.
  // Snaps when within 10% of an edge in x and y
  private getDot(gameCoords: Vec2d): Vec2d {
    // if pos within 10%, snap to closest edge
    const closestX = Math.round(gameCoords.x / 100) * 100;
    const closestY = Math.round(gameCoords.y / 100) * 100;
    const diffX = Math.abs(closestX - gameCoords.x);
    const diffY = Math.abs(closestY - gameCoords.y);
    const nX = diffX <= 10 ? closestX : gameCoords.x;
    const nY = diffY <= 10 ? closestY : gameCoords.y;
    return { x: nX, y: nY };
  }

  private setDot(gameCoords: Vec2d): void {
    const pos = toPixiCoords(gameCoords);
    this.dot.position.set(pos.x, pos.y);
  }

  public setCursorPos(gameCoords: Vec2d): void {
    const dotCoords = this.getDot(gameCoords);
    this.setDot(dotCoords);
    this.cursorText.text = "(" + dotCoords.x + ", " + dotCoords.y + ")";
  }

  public toggleGrid(): void {
    this.dot.visible = !this.showGrid;
    this.grid.gridSprite.visible = !this.showGrid;
    this.grid.axisSprite.visible = !this.showGrid;
    this.showGrid = !this.showGrid;
  }
}
