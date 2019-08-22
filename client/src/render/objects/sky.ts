import * as PIXI from "pixi.js";
import { spriteSheet } from "../textures";
import { toPixiCoords } from "../helpers";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "../constants";
import { Vec2d } from "../../../../dogfight/src/physics/vector";

export class SkySprite {
  public sprite: PIXI.TilingSprite;

  private pos: Vec2d;

  public constructor() {
    this.pos = toPixiCoords({ x: 0, y: 500 });
    const texture: PIXI.Texture = spriteSheet.textures["sky3b.jpg"];
    this.sprite = new PIXI.TilingSprite(texture);
    this.sprite.width = SCREEN_WIDTH;
    this.sprite.height = SCREEN_HEIGHT;
  }

  public setCamera(x: number, y: number): void {
    const paraX = Math.round(x / 6) - this.pos.x;
    const paraY = this.pos.y + Math.round(y / 3);
    this.sprite.tilePosition.set(paraX, paraY);
  }

  public resizeSky(width: number, height: number): void {
    this.sprite.width = width;
    this.sprite.height = height;
  }
}
