import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
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
    const rotation = directionToRadians(this.direction);
    this.bomb.rotation = -rotation;
  }

  public destroy(): void {
    //
  }
}
