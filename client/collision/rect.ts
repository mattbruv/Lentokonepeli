import * as PIXI from "pixi.js";
import { Vec2d } from "../../dogfight/src/rectangle";
import {
  randBetween,
  Draggable,
  onDragEnd,
  onDragMove,
  onDragStart,
  onKeyDown,
  Rotateable
} from "./helper";

const RECT_MIN = 20;
const RECT_MAX = 100;
const DIRECTIONS = 256;

export class RectExample implements Draggable, Rotateable {
  public sprite: PIXI.Sprite;
  public selected: false;
  public eventData: PIXI.interaction.InteractionData;

  public direction: number;
  public position: Vec2d;

  public constructor() {
    this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.sprite.tint = randBetween(0, 0xffffff);
    this.sprite.width = randBetween(RECT_MIN, RECT_MAX);
    this.sprite.height = randBetween(RECT_MIN, RECT_MAX);
    this.sprite.anchor.set(0.5);
    this.sprite.interactive = true;
    this.setPosition(randBetween(0, 750), randBetween(0, 750));
    this.setDirection(randBetween(0, DIRECTIONS));
    this.bindEventHandlers();
  }

  public setPosition(newX: number, newY: number): void {
    this.position = {
      x: Math.floor(newX),
      y: Math.floor(newY)
    };
    this.sprite.position.set(this.position.x, this.position.y);
    // console.log(this.position);
  }

  public setDirection(newAngle: number): void {
    newAngle = newAngle % DIRECTIONS;
    newAngle = newAngle < 0 ? DIRECTIONS + newAngle : newAngle;
    this.direction = newAngle;
    this.sprite.rotation = this.directionToRadians();
  }

  private directionToRadians(): number {
    return (Math.PI * 2 * this.direction) / DIRECTIONS;
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
