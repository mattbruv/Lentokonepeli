import * as PIXI from "pixi.js";
import { spriteSheet } from "../textures";
import { EntitySprite } from "./entity";
import { EntityType } from "../../../../dogfight/src/constants";
import { WaterEntity } from "../../../../dogfight/src/entities/water";
import { toPixiCoords } from "../helpers";
import { WaterColor } from "../constants";

export class WaterSprite implements EntitySprite {
  public id: number;
  public type: EntityType;
  public renderables: PIXI.DisplayObject[];

  private water: PIXI.Graphics;
  private waves: PIXI.Sprite;

  public constructor(data: WaterEntity) {
    this.id = data.id;
    this.type = data.type;
    this.renderables = [];

    console.log(data);

    const pos = toPixiCoords(data.position);
    const halfWidth = Math.round(data.width / 2);

    const texture = spriteSheet.textures["hill1.gif"];

    this.water = new PIXI.Graphics();
    this.water.beginFill(WaterColor.Normal);
    this.water.drawRect(pos.x - halfWidth, 0, data.width, 1000);
    this.water.endFill();

    this.renderables.push(this.water);
  }

  public update(data: WaterEntity): void {
    console.log(data);
  }
}
