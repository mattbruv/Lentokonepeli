import * as PIXI from "pixi.js";

export type rotateDirection = "right" | "left";

export function randBetween(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

export interface Draggable {
  selected: boolean;
  sprite: PIXI.Sprite;
  eventData: PIXI.interaction.InteractionData;
  setPosition(newX: number, newY: number);
}

export interface Rotateable {
  selected: boolean;
  rotation: number;
  setRotation(angle: number);
}

export function onDragStart(
  object: Draggable,
  event: PIXI.interaction.InteractionEvent
): void {
  object.sprite.alpha = 0.5;
  object.selected = true;
  object.eventData = event.data;
}

export function onDragEnd(object: Draggable): void {
  object.sprite.alpha = 1;
  object.selected = false;
  object.eventData = null;
}

export function onDragMove(object: Draggable): void {
  if (object.selected) {
    const newPos = object.eventData.getLocalPosition(object.sprite.parent);
    object.setPosition(newPos.x, newPos.y);
  }
}

export function onKeyDown(object: Rotateable, event: KeyboardEvent): void {
  if (object.selected) {
    console.log(event);
    switch (event.key) {
      case "ArrowRight": {
        break;
      }
      case "ArrowLeft": {
        break;
      }
      case "ArrowUp": {
      }
    }
  }
}
