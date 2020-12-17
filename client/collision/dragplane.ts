import { PlaneSprite } from "../src/render/sprites/plane";
import { Draggable, Renderable } from "./helper";
import {
  randBetween,
  onDragStart,
  onDragEnd,
  onDragMove
} from "./helper";

export class dragplane extends PlaneSprite implements Draggable, Renderable {
  public constructor(s) {
    super(s)
    this.x = 100;
    this.y = 100;
    this.sprite = this.container;
    this.sprite.interactive = true;
    this.sprite.buttonMode = true;

    this.bindEventHandlers();
  }
  private callback: () => void;

  selected: boolean;
  sprite: PIXI.Container;
  eventData: any;
  setPosition(newX: number, newY: number) {
    this.x = newX;
    this.y = newY;
    this.redraw();
    //console.log("move?");
    this.callback();
    //;throw new Error("Method not implemented.");
  }
  public setCollisionCallback(callback: () => void): void {
    this.callback = callback;
  }
  public getContainer(): PIXI.Container {
    return this.sprite;
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