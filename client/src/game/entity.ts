import * as PIXI from "pixi.js";
import { EntityType } from "../network/game/EntityType";

export enum Direction {
  LEFT,
  RIGHT,
}

export enum DrawLayer {
  LAYER_07,
  LAYER_08,
  LAYER_09,
  LAYER_10,
  LAYER_11,
  LAYER_12,
  LAYER_13,
  LAYER_14,
  LAYER_15,
  LAYER_16,
  LAYER_17,
}

export abstract class Entity {
  // Needed to compile dynamically applied parameters in update()
  [index: string]: any;

  abstract readonly type: EntityType;

  public update(data: any): void {
    for (const key in data) {
      let value = data[key];
      if (key == "y") {
        // value *= -1;
      }
      this[key] = value;
    }
    this.redraw();
  }

  abstract redraw(): void;
  abstract destroy(): void;
  abstract getContainer(): PIXI.Container;
}
