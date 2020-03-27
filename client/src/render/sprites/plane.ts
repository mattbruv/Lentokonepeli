import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";

export class PlaneSprite extends GameSprite {
  public x: number;
  public y: number;
  public health: number;
  public direction: number;

  private container: PIXI.Container;
  private spritesheet: PIXI.Spritesheet;

  private plane: PIXI.Sprite;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.x = 0;
    this.y = 0;
    this.health = 100;
    this.direction = 0;

    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();

    this.plane = new PIXI.Sprite();

    this.container.addChild(this.plane);
    this.container.zIndex = DrawLayer.Plane;

    this.renderables.push(this.container);
  }

  public redraw(): void {
    // update texture state
    // this.trooper.texture = this.spritesheet.textures[this.gettexture()];

    this.container.position.set(this.x, this.y);
  }

  public destroy(): void {
    //
  }
}
