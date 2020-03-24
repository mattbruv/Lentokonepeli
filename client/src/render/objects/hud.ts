import * as PIXI from "pixi.js";
import { GameScreen } from "../constants";

export class GameHud {
  public container: PIXI.Container;

  private enabled: boolean = false;

  private panel: PIXI.Sprite;
  private spritesheet: PIXI.Spritesheet;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.spritesheet = spritesheet;
    this.container = new PIXI.Container();
    const tex = spritesheet.textures["metalpanel.jpg"];
    this.panel = new PIXI.Sprite(tex);
    this.container.addChild(this.panel);

    this.container.position.y = GameScreen.Height - tex.height;

    this.setEnabled(true);
  }

  public getPanelHeight(): number {
    return this.panel.height;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(active: boolean): void {
    this.enabled = active;
    this.container.visible = this.enabled;
  }
}
