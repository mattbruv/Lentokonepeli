import * as PIXI from "pixi.js";
import {
  Renderable,
  Draggable,
  onDragStart,
  onDragEnd,
  onDragMove
} from "./helper";
import { Vec2d } from "../../dogfight/src/physics/vector";

export class PointSprite implements Renderable, Draggable {
  public selected: false;
  public sprite: PIXI.Graphics;
  public eventData: PIXI.interaction.InteractionData;
  public position: Vec2d;
  private callback: () => void;
  public constructor() {
    this.position = {
      x: 50,
      y: 50
    };
    this.sprite = new PIXI.Graphics();
    this.sprite.lineStyle(0);
    this.sprite.beginFill(0x000000, 1);
    this.sprite.drawCircle(0, 0, 2);
    this.sprite.endFill();
    this.sprite.position.set(this.position.x, this.position.y);
    this.sprite.interactive = true;
    this.sprite.buttonMode = true;
    this.bindEventHandlers();
  }

  public setPosition(newX: number, newY: number): void {
    this.position = { x: newX, y: newY };
    this.sprite.position.set(newX, newY);
    this.callback();
  }

  public getContainer(): PIXI.Container {
    return this.sprite;
  }

  public setCollisionCallback(callback: () => void): void {
    this.callback = callback;
  }

  private bindEventHandlers(): void {
    this.sprite.on(
      "pointerdown",
      (e: PIXI.interaction.InteractionEvent): void => onDragStart(this, e)
    );
    this.sprite.on("pointerup", (): void => onDragEnd(this));
    this.sprite.on("pointerupoutside", (): void => onDragEnd(this));
    this.sprite.on("pointermove", (): void => onDragMove(this));
  }
}
