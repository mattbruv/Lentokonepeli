import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Direction, DrawLayer, Entity } from "../entity";
import { getTexture } from "../resources";
import { WATER_COLOR, WATER_HEIGHT } from "./water";

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
  sprite = new PIXI.Sprite(getTexture("beach-l.gif"));
  water = new PIXI.Graphics();

  constructor() {
    super();
    //this.sprite.height = this.sprite.texture.height;

    this.container.addChild(this.water);
    this.container.addChild(this.sprite);

    this.container.zIndex = DrawLayer.Ground;
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

    this.water.beginFill(WATER_COLOR);
    this.water.drawRect(this.x, this.y + this.sprite.height, this.sprite.width, WATER_HEIGHT);
    // TODO: coast type
  }

  destroy() {}
}
