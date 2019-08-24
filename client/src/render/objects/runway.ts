import * as PIXI from "pixi.js";
import { spriteSheet } from "../textures";
import { EntitySprite } from "./entity";
import { EntityType, Facing } from "../../../../dogfight/src/constants";
import { toPixiCoords } from "../helpers";
import { DrawLayer } from "../constants";
import { RunwayEntity } from "../../../../dogfight/src/entities/runway";
import { DebugHitboxSprite } from "./debug";

export class RunwaySprite implements EntitySprite {
  public id: number;
  public type: EntityType;
  public renderables: PIXI.DisplayObject[];

  public sprite: PIXI.Sprite;
  public backSprite: PIXI.Sprite;

  private hitbox: DebugHitboxSprite;

  public constructor(data: RunwayEntity) {
    this.id = data.id;
    this.type = data.type;
    this.renderables = [];

    const pos = toPixiCoords(data.position);

    this.hitbox = new DebugHitboxSprite(data.hitbox, 0xff0000);

    const texture: PIXI.Texture = spriteSheet.textures["runway.gif"];
    const textLeft: PIXI.Texture = spriteSheet.textures["runway2.gif"];
    const textLeftBack: PIXI.Texture = spriteSheet.textures["runway2b.gif"];

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.65);
    this.sprite.position.set(pos.x, pos.y);
    this.sprite.zIndex = DrawLayer.LAYER16;

    this.renderables.push(this.sprite);
    this.renderables.push(this.hitbox.container);

    if (data.facing == Facing.Left) {
      this.sprite.texture = textLeft;
      this.backSprite = new PIXI.Sprite(textLeftBack);
      this.backSprite.zIndex = DrawLayer.LAYER15;
      this.backSprite.position.set(pos.x, pos.y);
      this.backSprite.anchor.set(-6.2, 0.85);

      this.renderables.push(this.backSprite);
    }
  }

  public update(data: RunwayEntity): void {
    console.log(data);
  }

  public setDebug(active: boolean): void {
    this.hitbox.setEnabled(active);
  }

  public onDestroy(): void {}
}
