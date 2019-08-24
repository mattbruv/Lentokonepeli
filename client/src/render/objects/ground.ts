import * as PIXI from "pixi.js";
import { spriteSheet } from "../textures";
import { EntitySprite } from "./entity";
import { EntityType } from "../../../../dogfight/src/constants";
import { toPixiCoords } from "../helpers";
import { GroundEntity } from "../../../../dogfight/src/entities/ground";
import { DrawLayer } from "../constants";
import { DebugHitboxSprite } from "./debug";

const HITBOX_COLOR = 0x800000;

export class GroundSprite implements EntitySprite {
  public id: number;
  public type: EntityType;
  public renderables: PIXI.DisplayObject[];

  private ground: PIXI.TilingSprite;
  private leftBeach: PIXI.Sprite;
  private rightBeach: PIXI.Sprite;

  private hitbox: DebugHitboxSprite;

  public constructor(data: GroundEntity) {
    this.id = data.id;
    this.type = data.type;
    this.renderables = [];

    this.hitbox = new DebugHitboxSprite(data.hitbox, HITBOX_COLOR);

    const textureGround: PIXI.Texture = spriteSheet.textures["ground1.gif"];
    const textureBeach: PIXI.Texture = spriteSheet.textures["beach-l.gif"];

    const pos = toPixiCoords(data.position);
    const halfWidth = Math.round(data.width / 2);
    const yAnchor = 0.2;

    this.ground = new PIXI.TilingSprite(textureGround);
    this.ground.width = data.width;
    this.ground.height = textureGround.height;
    this.ground.anchor.set(0.5, yAnchor);
    this.ground.position.set(pos.x, pos.y);
    this.ground.zIndex = DrawLayer.LAYER14;

    this.leftBeach = new PIXI.Sprite(textureBeach);
    this.leftBeach.position.set(pos.x - halfWidth, pos.y);
    this.leftBeach.anchor.set(1, yAnchor);
    this.leftBeach.zIndex = DrawLayer.LAYER14;

    this.rightBeach = new PIXI.Sprite(textureBeach);
    this.rightBeach.position.set(pos.x + halfWidth, pos.y);
    this.rightBeach.anchor.set(1, yAnchor);
    this.rightBeach.scale.x = -1;
    this.rightBeach.zIndex = DrawLayer.LAYER14;

    this.renderables.push(this.ground);
    this.renderables.push(this.leftBeach);
    this.renderables.push(this.rightBeach);
    this.renderables.push(this.hitbox.container);
  }

  public update(data: GroundEntity): void {
    console.log(data);
  }

  public setDebug(active: boolean): void {
    this.hitbox.setEnabled(active);
  }

  public onDestroy(): void {}
}
