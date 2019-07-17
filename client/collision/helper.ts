import * as PIXI from "pixi.js";

export type rotateDirection = "right" | "left";

export function randBetween(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

export interface Draggable {
  dragging: boolean;
  sprite: PIXI.Sprite;
  eventData: PIXI.interaction.InteractionData;
  rotate(dir: rotateDirection): void;
  resetDirection(): void;
}

export function onDragStart(
  object: Draggable,
  event: PIXI.interaction.InteractionEvent
): void {
  object.sprite.alpha = 0.5;
  object.dragging = true;
  object.eventData = event.data;
}

export function onDragEnd(object: Draggable): void {
  object.sprite.alpha = 1;
  object.dragging = false;
  object.eventData = null;
}

export function onDragMove(object: Draggable): void {
  if (object.dragging) {
    const newPos = object.eventData.getLocalPosition(object.sprite.parent);
    object.sprite.x = newPos.x;
    object.sprite.y = newPos.y;
  }
}

export function onKeyDown(object: Draggable, event: KeyboardEvent): void {
  if (object.dragging) {
    // console.log(event);
    switch (event.key) {
      case "ArrowRight": {
        object.rotate("right");
        break;
      }
      case "ArrowLeft": {
        object.rotate("left");
        break;
      }
      case "ArrowUp": {
        object.resetDirection();
      }
    }
  }
}
