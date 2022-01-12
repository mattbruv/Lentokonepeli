import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Entity } from "../entity";
import { getTexture } from "../resources";

export interface GroundProps {
  x?: number;
  y?: number;
  width?: number;
  type?: number;
}

export class Ground extends Entity {
  x = 0;
  y = 0;
  width = 100;
  type = EntityType.GROUND;

  container = new PIXI.Container();
  sprite = new PIXI.TilingSprite(getTexture("ground1.gif")!);

  constructor() {
    super();
    this.sprite.height = this.sprite.texture.height;
    this.container.addChild(this.sprite);
  }

  getContainer(): PIXI.Container {
      return this.container;
  }

  redraw() {
    this.sprite.position.set(this.x, this.y);
    this.sprite.width = this.width;
    // TODO: change ground type
  }

  destroy() {}

}
