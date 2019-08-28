import * as PIXI from "pixi.js";
import { RectangleModel } from "../../../../dogfight/src/physics/rectangle";
import { DrawLayer } from "../constants";
import { toPixiCoords } from "../helpers";
import { directionToRadians } from "../../../../dogfight/src/physics/vector";

const OPACITY = 0.2;

export class DebugHitboxSprite {
  private color: number;

  private sprite: PIXI.Graphics;
  public container: PIXI.Container;

  public constructor(hitbox: RectangleModel, color: number) {
    this.container = new PIXI.Container();
    this.color = color;

    this.sprite = new PIXI.Graphics();
    this.sprite.pivot.set(0.5, 0.5);
    this.drawHitbox(hitbox);

    this.container.zIndex = DrawLayer.LAYER17;
    this.container.addChild(this.sprite);

    this.setEnabled(false);
  }

  public drawHitbox(hitbox: RectangleModel): void {
    this.sprite.clear();
    const halfWidth = Math.round(hitbox.width / 2);
    const halfHeight = Math.round(hitbox.height / 2);

    const pos = toPixiCoords(hitbox.center);
    this.container.position.set(pos.x, pos.y);

    this.sprite.lineStyle(2, this.color, 1);
    this.sprite.beginFill(this.color, OPACITY);

    this.sprite.drawRect(-halfWidth, -halfHeight, hitbox.width, hitbox.height);

    this.sprite.lineStyle(1, this.color, 1);
    this.sprite.moveTo(-halfWidth, -halfHeight);
    this.sprite.lineTo(halfWidth, halfHeight);
    this.sprite.moveTo(-halfWidth, halfHeight);
    this.sprite.lineTo(halfWidth, -halfHeight);

    this.sprite.lineStyle(0);
    this.sprite.beginFill(this.color, 1);
    this.sprite.drawCircle(0, 0, 3);

    this.sprite.endFill();

    const radians = directionToRadians(hitbox.direction);
    this.sprite.rotation = radians;
  }

  public setEnabled(active: boolean): void {
    this.container.visible = active;
  }
}
