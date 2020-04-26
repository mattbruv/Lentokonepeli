import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";

export class BombSprite extends GameSprite {
  public x: number;
  public y: number;

  private spritesheet: PIXI.Spritesheet;

  private container: PIXI.Container;

  private bomb: PIXI.Graphics;

  private timeout: number;

  private bombColorIndex: number = 0;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.x = 0;
    this.y = 0;

    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();
    this.bomb = new PIXI.Graphics();

    this.container.zIndex = DrawLayer.Bomb;
    this.container.addChild(this.bomb);

    this.renderables.push(this.container);
  }

  public redraw(): void {
    this.bomb.clear();
    // this.bomb.beginFill(bombColors[this.bombColorIndex]);
    this.bomb.beginFill(0);
    this.bomb.drawCircle(this.x, this.y, 3.0);
    this.bomb.endFill();
    // something
  }

  public destroy(): void {
    window.clearTimeout(this.timeout);
  }
}
