import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import { bulletGlobals } from "../../../../dogfight/src/entities/Bullet";

const bulletColors = [0, 1118481, 3355443, 6316128, 10066329];

export class BulletSprite extends GameSprite {
  public x: number;
  public y: number;
  public clientVX: number;
  public clientVY: number;

  private spritesheet: PIXI.Spritesheet;

  private container: PIXI.Container;

  private bullet: PIXI.Graphics;

  private timeout: number;

  private bulletColorIndex: number = 0;
  private ageRate = Math.round(bulletGlobals.lifetime / 5);

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.x = 0;
    this.y = 0;
    this.clientVX = 0;
    this.clientVY = 0;

    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();
    this.bullet = new PIXI.Graphics();

    this.container.zIndex = DrawLayer.Bullet;
    this.container.addChild(this.bullet);

    this.renderables.push(this.container);

    this.timeout = window.setTimeout((): void => {
      this.ageColor();
    }, this.ageRate);
  }

  private ageColor(): void {
    this.bulletColorIndex++;
    if (this.bulletColorIndex >= bulletColors.length) {
      this.bulletColorIndex = bulletColors.length - 1;
    }
    // console.log(bulletColors[this.bulletColorIndex]);
    this.timeout = window.setTimeout((): void => {
      this.ageColor();
    }, this.ageRate);
  }

  public redraw(): void {
    this.bullet.clear();
    this.bullet.beginFill(bulletColors[this.bulletColorIndex]);
    this.bullet.drawRect(this.x, this.y, 3, 2);
    this.bullet.endFill();
  }

  public destroy(): void {
    window.clearTimeout(this.timeout);
  }
}
