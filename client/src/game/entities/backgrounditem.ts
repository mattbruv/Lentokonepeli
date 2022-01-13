import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { BackgroundItemType, Direction, DrawLayer, Entity } from "../entity";
import { getTexture } from "../resources";

export interface TowerProps {
  x?: number;
  y?: number;
  type?: number;
  direction?: number;
}

export class BackgroundItem extends Entity {
  x = 0;
  y = 0;
  direction = Direction.LEFT;
  type = EntityType.BACKGROUND_ITEM;
  subType = BackgroundItemType.NORMAL_TOWER;

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

    switch (this.subType) {
      case BackgroundItemType.DESERT_TOWER:
        this.sprite.texture = getTexture("controlTowerDesert.gif");
        break;
      case BackgroundItemType.PALM_TREE:
        this.sprite.texture = getTexture("palmtree.gif");
      default: {
      }
    }

    const xPos = this.x - Math.round(this.sprite.width / 2);
    const yPos = this.y - this.sprite.height;
    this.sprite.position.set(xPos, yPos);

    if (this.direction == Direction.RIGHT) {
      this.sprite.anchor.x = 1;
      this.sprite.scale.x *= -1;
    }
  }

  destroy() { }
}
