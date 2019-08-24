import * as PIXI from "pixi.js";
import { spriteSheet } from "../textures";
import { EntitySprite } from "./entity";
import { EntityType } from "../../../../dogfight/src/constants";
import { toPixiCoords } from "../helpers";
import { HillEntity } from "../../../../dogfight/src/entities/hill";
import { DrawLayer } from "../constants";
import { Vec2d } from "../../../../dogfight/src/physics/vector";

export class HillSprite implements EntitySprite {
  public id: number;
  public type: EntityType;
  public renderables: PIXI.DisplayObject[];
  public sprite: PIXI.Sprite;
  public pos: Vec2d;

  public constructor(data: HillEntity) {
    this.id = data.id;
    this.type = data.type;
    this.renderables = [];

    this.pos = toPixiCoords(data.position);

    const texture: PIXI.Texture = spriteSheet.textures["hill1.gif"];

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.8);
    this.sprite.position.set(this.pos.x, this.pos.y);
    this.sprite.zIndex = DrawLayer.LAYER13;

    this.renderables.push(this.sprite);
  }

  public update(data: HillEntity): void {
    console.log(data);
  }

  public setDebug(active: boolean): void {}

  public onDestroy(): void {}
}
