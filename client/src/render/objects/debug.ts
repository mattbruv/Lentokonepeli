import * as PIXI from "pixi.js";
import { GridObject } from "./grid";
import { Vec2d } from "../../../../dogfight/src/physics/vector";

export class DebugView {
  public gameContainer: PIXI.Container;
  public worldContainer: PIXI.Container;
  private cursorText: PIXI.Text;

  private grid: GridObject;

  private enabled: boolean = false;

  public constructor(renderer: PIXI.Renderer) {
    this.worldContainer = new PIXI.Container();
    this.gameContainer = new PIXI.Container();
    this.grid = new GridObject(renderer);

    // cursor text
    this.cursorText = new PIXI.Text("", { fontSize: 24 });
    this.cursorText.position.set(5, 5);

    this.gameContainer.addChild(this.grid.container);
    this.gameContainer.addChild(this.cursorText);

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

  public resetZoom(): void {
    this.grid.gridSprite.tileScale.set(1);
    this.grid.axisSprite.scale.set(1);
  }

  public zoom(factor: number): void {
    this.grid.gridSprite.tileScale.x *= factor;
    this.grid.gridSprite.tileScale.y *= factor;
    this.grid.axisSprite.scale.x *= factor;
    this.grid.axisSprite.scale.y *= factor;
  }

  public setCursorPos(gameCoords: Vec2d): void {
    this.cursorText.text = "(" + gameCoords.x + ", " + gameCoords.y + ")";
  }
}
