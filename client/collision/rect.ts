import * as PIXI from "pixi.js";
import {
  randBetween,
  Draggable,
  onDragEnd,
  onDragMove,
  onDragStart,
  onKeyDown,
  rotateDirection
} from "./helper";

export class Rectangle implements Draggable {
  public x: number;
  public sprite: PIXI.Sprite;
  public dragging: false;
  public direction: number;
  public eventData: PIXI.interaction.InteractionData;

  public constructor() {
    this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.sprite.tint = randBetween(0, 0xffffff);
    this.sprite.width = randBetween(20, 100);
    this.sprite.height = randBetween(20, 100);
    this.sprite.position.set(randBetween(0, 1000), randBetween(0, 1000));
    this.sprite.interactive = true;
    this.sprite.buttonMode = true;
    this.sprite.anchor.set(0.5);
    this.direction = 0;
    this.bindEventHandlers();
  }

  public rotate(dir: rotateDirection): void {
    /*
      DIRECTIONS = 256
      IMAGE_DIRECTIONS = 128
    */
    if (dir === "right") {
      this.setDirection(this.direction + 1);
    } else {
      this.setDirection(this.direction - 1);
    }
  }

  private setDirection(angle: number): void {
    angle = angle % 256;
    angle = angle < 0 ? 256 + angle : angle;
    this.direction = angle;
    this.sprite.rotation = this.getRotation();
    console.log(this.direction);
  }

  public resetDirection(): void {
    this.setDirection(0);
  }

  private getRotation(): number {
    return (Math.PI * 2 * this.direction) / 256;
  }

  private bindEventHandlers(): void {
    this.sprite.on(
      "pointerdown",
      (e: PIXI.interaction.InteractionEvent): void => onDragStart(this, e)
    );
    this.sprite.on("pointerup", (): void => onDragEnd(this));
    this.sprite.on("pointerupoutside", (): void => onDragEnd(this));
    this.sprite.on("pointermove", (): void => onDragMove(this));
    document.addEventListener("keydown", (event: KeyboardEvent): void =>
      onKeyDown(this, event)
    );
  }
}
