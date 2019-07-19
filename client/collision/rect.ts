import * as PIXI from "pixi.js";
import { RectangleModel } from "../../dogfight/src/rectangle";
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

/**
 * This is an example Rectangle object
 * with the basic properties to simulate a rectangle.
 * Something similar to the rectangle object in the Dogfight engine.
 * We only care about collision detection here,
 * so we're not going to flesh this out beyond that.
 */

export class RectangleSprite implements Draggable, Rotateable {
  public sprite: PIXI.Sprite;
  public selected: false;
  public eventData: PIXI.interaction.InteractionData;
  public rectObj: RectangleModel;

  public constructor() {
    this.rectObj = {
      width: randBetween(RECT_MIN, RECT_MAX),
      height: randBetween(RECT_MIN, RECT_MAX),
      center: {
        x: randBetween(0, 750),
        y: randBetween(0, 750)
      },
      direction: 0
    };
    // Initialize sprite
    this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.sprite.tint = randBetween(0, 0xffffff);
    this.sprite.width = this.rectObj.width;
    this.sprite.height = this.rectObj.height;
    this.sprite.anchor.set(0.5);
    this.sprite.interactive = true;
    this.sprite.buttonMode = true;

    // Intialize object properties
    this.setPosition(randBetween(0, 750), randBetween(0, 750));
    this.setDirection(randBetween(0, DIRECTIONS));
    this.bindEventHandlers();
  }

  public setPosition(newX: number, newY: number): void {
    this.rectObj.center = {
      x: Math.floor(newX),
      y: Math.floor(newY)
    };
    this.sprite.position.set(this.rectObj.center.x, this.rectObj.center.y);
    console.log(this.rectObj.center);
  }

  public getDirection(): number {
    return this.rectObj.direction;
  }

  public setDirection(newAngle: number): void {
    newAngle = newAngle % DIRECTIONS;
    newAngle = newAngle < 0 ? DIRECTIONS + newAngle : newAngle;
    this.rectObj.direction = newAngle;
    this.sprite.rotation = this.directionToRadians();
    console.log("Direction: " + this.rectObj.direction);
    console.log(this.sprite.rotation);
  }

  private directionToRadians(): number {
    return (Math.PI * 2 * this.rectObj.direction) / DIRECTIONS;
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

class RectangleSpriteDebug {
  public constructor() {}
}
