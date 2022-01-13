import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Direction, DrawLayer, Entity } from "../entity";
import { getTexture } from "../resources";

export interface TowerProps {
  x?: number;
  y?: number;
  type?: number;
  direction?: number;
}

export class Tower extends Entity {
  x = 0;
  y = 0;
  direction = Direction.LEFT;
  type = EntityType.TOWER;

  container = new PIXI.Container();
  sprite = new PIXI.Sprite(getTexture("controlTower.gif"));

  constructor() {
    super();

    this.container.addChild(this.sprite);
    this.container.zIndex = DrawLayer.ControlTower;
  }

  getContainer(): PIXI.Container {
      return this.container;
  }

  redraw() {
    console.log("redraw tower!");
    console.log(this.x, this.y)
    const xPos = this.x - Math.round(this.sprite.width / 2);
    const yPos = this.y - this.sprite.height;
    this.sprite.position.set(xPos, yPos);

    if (this.direction == Direction.RIGHT) {
      this.sprite.anchor.x = 1;
      this.sprite.scale.x *= -1;
    }
  }

  destroy() {}
}
