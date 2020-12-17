import * as PIXI from "pixi.js";
import { Vec2d } from "../../dogfight/src/physics/vector";
import {
  RectangleBody,
  RectanglePoints,
  getRotatedRectPoints
} from "../../dogfight/src/physics/rectangle";
import {
  randBetween,
  Draggable,
  onDragEnd,
  onDragMove,
  onDragStart,
  onKeyDown,
  Rotateable,
  Renderable
} from "./helper";
import { directionToRadians } from "../../dogfight/src/physics/helpers";

const RECT_MIN = 20;
const RECT_MAX = 100;
const DIRECTIONS = 256;

/**
 * A class for rendering points/edges of a rectangle
 */
class RectangleSpriteDebug {
  public graphics: PIXI.Graphics;

  public constructor() {
    this.graphics = new PIXI.Graphics();
  }

  public update(rect: RectangleBody): void {
    const points = getRotatedRectPoints(rect);
    this.graphics.clear();
    this.drawRect(points);
    this.drawPoints(points);
  }

  private drawPoints(p: RectanglePoints): void {
    this.graphics.beginFill(0x0000ff);
    this.graphics.lineStyle(0);
    this.drawSinglePoint(p.upperLeft);
    this.graphics.beginFill(0xff0000);
    this.drawSinglePoint(p.upperRight);
    this.drawSinglePoint(p.lowerRight);
    this.drawSinglePoint(p.lowerLeft);
    this.graphics.endFill();
  }

  private drawSinglePoint(point: Vec2d): void {
    this.graphics.drawCircle(point.x, point.y, 3);
  }

  private drawRect(p: RectanglePoints): void {
    // this.graphics.beginFill(0xff00ff);
    this.graphics.lineStyle(2, 0xffff00, 1);
    this.graphics.moveTo(p.upperLeft.x, p.upperLeft.y);
    this.graphics.lineTo(p.upperRight.x, p.upperRight.y);
    this.graphics.lineTo(p.lowerRight.x, p.lowerRight.y);
    this.graphics.lineTo(p.lowerLeft.x, p.lowerLeft.y);
    this.graphics.closePath();
    this.graphics.endFill();
  }
}

/**
 * This is an example Rectangle object
 * with the basic properties to simulate a rectangle.
 * Something similar to the rectangle object in the Dogfight engine.
 * We only care about collision detection here,
 * so we're not going to flesh this out beyond that.
 */
export class RectangleSprite implements Renderable, Draggable, Rotateable {
  public selected: false;
  public eventData: PIXI.interaction.InteractionData;
  public rectObj: RectangleBody;

  private container: PIXI.Container;
  public sprite: PIXI.Sprite;
  private debugSprite: RectangleSpriteDebug;
  public tint: number;
  private callback: () => void;

  public constructor() {
    this.callback = (): void => { };
    this.container = new PIXI.Container();
    this.debugSprite = new RectangleSpriteDebug();
    this.rectObj = {
      width: randBetween(RECT_MIN, RECT_MAX),
      height: randBetween(RECT_MIN, RECT_MAX),
      center: {
        x: randBetween(0, 750),
        y: randBetween(0, 750)
      },
      direction: 0
    };
    this.tint = randBetween(0, 0xffffff);
    // Initialize sprite
    this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.sprite.tint = this.tint;
    this.sprite.width = this.rectObj.width;
    this.sprite.height = this.rectObj.height;
    this.sprite.anchor.set(0.5);
    this.sprite.interactive = true;
    this.sprite.buttonMode = true;

    // Intialize object properties
    this.setDirection(randBetween(0, DIRECTIONS));
    this.setPosition(randBetween(0, 750), randBetween(0, 750));
    this.bindEventHandlers();

    // Add sprites to the container
    this.container.addChild(this.sprite);
    this.container.addChild(this.debugSprite.graphics);
  }

  public setCollisionCallback(callback: () => void): void {
    this.callback = callback;
  }

  private updateCollisions(): void {
    this.callback();
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public setPosition(newX: number, newY: number): void {
    this.rectObj.center = {
      x: Math.floor(newX),
      y: Math.floor(newY)
    };
    this.sprite.position.set(this.rectObj.center.x, this.rectObj.center.y);
    // console.log(this.rectObj.center);
    this.debugSprite.update(this.rectObj);
    this.updateCollisions();
  }

  public getDirection(): number {
    return this.rectObj.direction;
  }

  public setDirection(newAngle: number): void {
    newAngle = newAngle % DIRECTIONS;
    newAngle = newAngle < 0 ? DIRECTIONS + newAngle : newAngle;
    this.rectObj.direction = newAngle;
    this.sprite.rotation = directionToRadians(this.rectObj.direction);
    this.debugSprite.update(this.rectObj);
    console.log("Direction: " + this.rectObj.direction);
    console.log(this.sprite.rotation);
    this.updateCollisions();
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
