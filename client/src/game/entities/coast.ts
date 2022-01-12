import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Direction, Entity } from "../entity";
import { getTexture } from "../resources";

export interface CoastProps {
  x?: number;
  y?: number;
  type?: number;
  direction?: number;
}

export class Coast extends Entity {
  x = 0;
  y = 0;
  direction = Direction.LEFT;
  type = EntityType.COAST;

  container = new PIXI.Container();
  sprite = new PIXI.Sprite(getTexture("beach-l.gif")!);

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
    if (this.direction == Direction.RIGHT) {
      this.sprite.anchor.x = 1;
      this.sprite.scale.x *= -1;
    }
    // TODO: coast type
  }

  destroy() {}
}
