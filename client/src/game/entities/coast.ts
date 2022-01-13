import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Direction, DrawLayer, Entity, TerrainType } from "../entity";
import { getTexture } from "../resources";
import { WATER_COLOR, WATER_DESERT_COLOR, WATER_HEIGHT } from "./water";

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
  subType = TerrainType.NORMAL;

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
    if (this.subType == TerrainType.DESERT) {
      this.sprite.texture = getTexture("beach-l_desert.gif");
    } else {
      this.sprite.texture = getTexture("beach-l.gif");
    }

    this.sprite.position.set(this.x, this.y);

    if (this.direction == Direction.RIGHT) {
      this.sprite.scale.x = -1;
      this.sprite.position.x += this.sprite.width;
      // miror sprite
    }

    const color = (this.subType == TerrainType.NORMAL) ? WATER_COLOR : WATER_DESERT_COLOR;
    this.water.beginFill(color);
    this.water.drawRect(this.x, this.y + this.sprite.height, this.sprite.width, WATER_HEIGHT);
  }

  destroy() {}
}
