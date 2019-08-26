import * as PIXI from "pixi.js";
import { spriteSheet } from "../textures";
import { EntitySprite } from "./entity";
import { EntityType } from "../../../../dogfight/src/constants";
import { toPixiCoords } from "../helpers";
import { DrawLayer } from "../constants";
import { Vec2d } from "../../../../dogfight/src/physics/vector";
import { ManEntity, ManStatus } from "../../../../dogfight/src/entities/man";
import { DebugHitboxSprite } from "./debug";

const HITBOX_COLOR = 0xffff00;

export class ManSprite implements EntitySprite {
  public id: number;
  public type: EntityType;
  public renderables: PIXI.DisplayObject[];

  public sprite: PIXI.Sprite;
  public pos: Vec2d;

  private hitbox: DebugHitboxSprite;

  public constructor(data: ManEntity) {
    this.id = data.id;
    this.type = data.type;
    this.renderables = [];

    console.log(data.hitbox);
    this.hitbox = new DebugHitboxSprite(data.hitbox, HITBOX_COLOR);

    this.pos = toPixiCoords(data.position);

    const texName = this.getTexture(data.status);
    const texture: PIXI.Texture = spriteSheet.textures[texName];

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.position.set(this.pos.x, this.pos.y);
    this.sprite.zIndex = DrawLayer.LAYER15;

    this.renderables.push(this.sprite);
    this.renderables.push(this.hitbox.container);
  }

  public update(data: ManEntity): void {
    console.log(data);
  }

  public setDebug(active: boolean): void {
    this.hitbox.setEnabled(active);
  }

  public onDestroy(): void {}

  private getTexture(status: ManStatus): string {
    switch (status) {
      case ManStatus.Parachuting:
        return "parachuter1.gif";
      case ManStatus.Falling:
      case ManStatus.Standing:
        return "parachuter0.gif";
      default:
        return "parachuter2.gif";
    }
  }
}
