import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { DrawLayer, Entity, TerrainType } from "../entity";
import { getTexture } from "../resources";
import { WATER_COLOR, WATER_DESERT_COLOR, WATER_HEIGHT } from "./water";

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
  subType = TerrainType.NORMAL;

  container = new PIXI.Container();
  sprite = new PIXI.TilingSprite(getTexture("ground1.gif"));
  water = new PIXI.Graphics();

  constructor() {
    super();
    this.sprite.height = this.sprite.texture.height;

    this.container.sortableChildren = true;
    this.container.addChild(this.water);
    this.container.addChild(this.sprite);
    this.container.zIndex = DrawLayer.Ground;
  }

  getContainer(): PIXI.Container {
      return this.container;
  }

  redraw() {
    this.sprite.position.set(this.x, this.y);
    this.sprite.width = this.width;

    if (this.subType == TerrainType.DESERT) {
      this.sprite.texture = getTexture("groundDesert.gif");
    }

    const color = (this.subType == TerrainType.NORMAL) ? WATER_COLOR : WATER_DESERT_COLOR;
    this.water.beginFill(color);
    this.water.drawRect(this.x, this.y + this.sprite.height, this.width, WATER_HEIGHT);
    this.water.endFill();

    // TODO: change ground type

  }

  destroy() {}

}
