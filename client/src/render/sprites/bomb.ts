import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import { bulletGlobals } from "../../../../dogfight/src/objects/bullet";

const bombColors = [0, 1118481, 3355443, 6316128, 10066329];

export class BombSprite extends GameSprite {
  public x: number;
  public y: number;

  private spritesheet: PIXI.Spritesheet;

  private container: PIXI.Container;

  private bomb: PIXI.Graphics;

  private timeout: number;

  private bombColorIndex: number = 0;
  private ageRate = Math.round(bulletGlobals.lifetime / 5);

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

    this.timeout = window.setTimeout((): void => {
      this.ageColor();
    }, this.ageRate);
  }

  private ageColor(): void {
    this.bombColorIndex++;
    if (this.bombColorIndex >= bombColors.length) {
      this.bombColorIndex = bombColors.length - 1;
    }
    // console.log(bulletColors[this.bulletColorIndex]);
    this.timeout = window.setTimeout((): void => {
      this.ageColor();
    }, this.ageRate);
  }

  public redraw(): void {
    this.bomb.clear();
    this.bomb.beginFill(bombColors[this.bombColorIndex]);
    this.bomb.drawCircle(this.x, this.y, 3.0);
    this.bomb.endFill();
    // something
  }

  public destroy(): void {
    window.clearTimeout(this.timeout);
  }
}
