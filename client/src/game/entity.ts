import * as PIXI from "pixi.js";
import { EntityType } from "../network/game/EntityType";

export enum Direction {
  LEFT,
  RIGHT,
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
