import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";

export class BulletSprite extends GameSprite {
  public x: number;
  public y: number;

  private spritesheet: PIXI.Spritesheet;

  private container: PIXI.Container;

  private bullet: PIXI.Graphics;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.x = 0;
    this.y = 0;

    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();
    this.bullet = new PIXI.Graphics();

    this.container.zIndex = DrawLayer.Bullet;
    this.container.addChild(this.bullet);

    this.renderables.push(this.container);
  }

  public redraw(): void {
    this.bullet.clear();
    this.bullet.beginFill(0xff0000);
    this.bullet.drawCircle(this.x, this.y, 10);
    this.bullet.endFill();
    // something
  }

  public destroy(): void {
    //
  }
}
