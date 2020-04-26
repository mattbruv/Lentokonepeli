import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import { getAngle, Vec2d } from "../../../../dogfight/src/physics/vector";
import { directionToRadians } from "../../../../dogfight/src/physics/helpers";

export class BombSprite extends GameSprite {
  public x: number;
  public y: number;
  public direction: number;

  private spritesheet: PIXI.Spritesheet;

  private container: PIXI.Container;

  private bomb: PIXI.Sprite;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.x = 0;
    this.y = 0;
    this.direction = 0;

    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();
    const tex = this.spritesheet.textures["bomb.gif"];
    this.bomb = new PIXI.Sprite(tex);

    this.container.zIndex = DrawLayer.Bomb;
    this.container.addChild(this.bomb);

    this.renderables.push(this.container);
  }

  public redraw(): void {
    this.bomb.position.set(this.x, this.y);
    const angle = directionToRadians(this.direction);
    console.log(angle);
    /*
    this.bomb has a .angle property for angle, and .rotation property for radians I believe
    */
    this.bomb.rotation = -angle;
  }

  public destroy(): void {
    //
  }
}
