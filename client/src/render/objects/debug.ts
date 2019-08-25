import * as PIXI from "pixi.js";
import { RectangleModel } from "../../../../dogfight/src/physics/rectangle";
import { DrawLayer } from "../constants";
import { toPixiCoords } from "../helpers";

const OPACITY = 0.2;

export class DebugHitboxSprite {
  private hitbox: RectangleModel;

  private sprite: PIXI.Graphics;
  public container: PIXI.Container;

  public constructor(hitbox: RectangleModel, color: number) {
    this.container = new PIXI.Container();
    this.hitbox = hitbox;

    const halfWidth = Math.round(hitbox.width / 2);
    const halfHeight = Math.round(hitbox.height / 2);

    const pos = toPixiCoords(hitbox.center);

    this.sprite = new PIXI.Graphics();
    this.sprite.lineStyle(2, color, 1);
    this.sprite.beginFill(color, OPACITY);

    this.sprite.drawRect(
      pos.x - halfWidth,
      pos.y - halfHeight,
      hitbox.width,
      hitbox.height
    );

    this.sprite.lineStyle(0);
    this.sprite.beginFill(color, 1);
    this.sprite.drawCircle(pos.x, pos.y, 3);

    this.sprite.endFill();

    this.container.zIndex = DrawLayer.LAYER17;
    this.container.addChild(this.sprite);

    this.setEnabled(false);
  }

  public setEnabled(active: boolean): void {
    this.container.visible = active;
  }
}
