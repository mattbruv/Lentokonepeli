import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Entity } from "../entity";
import { getTexture } from "../resources";

export interface WaterProps {
  x?: number;
  y?: number;
  width?: number;
  direction?: number;
  type?: number;
}

export class Water extends Entity {
  type = EntityType.WATER;

  container = new PIXI.Container();
  sprite = new PIXI.TilingSprite(getTexture("ground1.gif")!);

  constructor() {
    super();
    this.sprite.height = this.sprite.texture.height;
  }

  redraw() {
    console.log("Redraw water called!");
  }

  getContainer(): PIXI.Container {
      return this.container;
  }

  destroy() {}
}
