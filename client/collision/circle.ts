import * as PIXI from "pixi.js";
import {
  Renderable,
  Draggable,
  randBetween,
  onDragStart,
  onDragEnd,
  onDragMove
} from "./helper";
import { CircleBody } from "../../dogfight/src/physics/circle";

export class CircleSprite implements Renderable, Draggable {
  public selected: false;
  public circleObj: CircleBody;
  public sprite: PIXI.Graphics;
  public eventData: PIXI.interaction.InteractionData;
  private callback: () => void;
  public constructor() {
    this.circleObj = {
      radius: randBetween(25, 100),
      center: { x: 50, y: 50 }
    };
    this.sprite = new PIXI.Graphics();
    this.sprite.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
    this.sprite.beginFill(0xde32ff, 1);
    this.sprite.drawCircle(0, 0, this.circleObj.radius);
    this.sprite.endFill();
    this.sprite.position.set(this.circleObj.center.x, this.circleObj.center.y);
    this.sprite.interactive = true;
    this.sprite.buttonMode = true;
    this.bindEventHandlers();
  }

  public setPosition(newX: number, newY: number): void {
    this.circleObj.center = { x: newX, y: newY };
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
