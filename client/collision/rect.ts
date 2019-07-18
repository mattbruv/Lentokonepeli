import * as PIXI from "pixi.js";
import {
  Vec2d,
  Rectangle,
  rectFromDimensions
} from "../../dogfight/src/rectangle";
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

interface RectExample {
  model: Rectangle;
}

export class Rect implements RectExample, Draggable, Rotateable {
  public sprite: PIXI.Sprite;
  public selected: false;
  public eventData: PIXI.interaction.InteractionData;

  public direction: number;
  public position: Vec2d;
  public model: Rectangle;

  public width: number;
  public height: number;

  public constructor() {
    this.width = randBetween(RECT_MIN, RECT_MAX);
    this.height = randBetween(RECT_MIN, RECT_MAX);

    // Initialize sprite
    this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.sprite.tint = randBetween(0, 0xffffff);
    this.sprite.width = this.width;
    this.sprite.height = this.height;
    this.sprite.anchor.set(0.5);
    this.sprite.interactive = true;

    // Intialize object properties
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
    console.log({ w: this.width, h: this.height });
    console.log(this.position);
    this.model = rectFromDimensions(this.position, this.width, this.height);
    console.log(this.model);
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
