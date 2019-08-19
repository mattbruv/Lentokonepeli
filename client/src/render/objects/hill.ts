import * as PIXI from "pixi.js";
import { spriteSheet } from "../textures";
import { EntitySprite } from "./entity";
import { EntityType } from "../../../../dogfight/src/constants";
import { toPixiCoords } from "../helpers";
import { HillEntity } from "../../../../dogfight/src/entities/hill";
import { DrawLayer } from "../constants";

export class HillSprite implements EntitySprite {
  public id: number;
  public type: EntityType;
  public renderables: PIXI.DisplayObject[];

  public sprite: PIXI.Sprite;

  public constructor(data: HillEntity) {
    this.id = data.id;
    this.type = data.type;
    this.renderables = [];

    const pos = toPixiCoords(data.position);

    const texture: PIXI.Texture = spriteSheet.textures["hill1.gif"];

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.8);
    this.sprite.position.set(pos.x, pos.y);
    this.sprite.zIndex = DrawLayer.LAYER13;

    this.renderables.push(this.sprite);
  }

  public update(data: HillEntity): void {
    console.log(data);
  }

  public onDestroy(): void {}
}
