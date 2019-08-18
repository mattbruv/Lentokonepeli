import * as PIXI from "pixi.js";
import { spriteSheet } from "../textures";
import { toPixiCoords } from "../helpers";

export class HillSprite {
  public container: PIXI.Sprite;
  public constructor() {
    const texture = spriteSheet.textures["hill1.gif"];
    this.container = new PIXI.Sprite(texture);
    const pos = toPixiCoords({ x: 0, y: 0 });
    this.container.anchor.set(0.5);
    this.container.position.set(pos.x, pos.y);
  }
}
