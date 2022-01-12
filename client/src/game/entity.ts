import * as PIXI from "pixi.js";
import { EntityType } from "../network/game/EntityType";

export enum Direction {
  LEFT,
  RIGHT,
}

// in PIXI.js, a lower value = further back
// 14 is before 11
export enum DrawLayer {
  LAYER_07, // = 1000,
  LAYER_08, // = 990,
  LAYER_09, // = 980,
  LAYER_10, // = 970,
  LAYER_11, // = 960,
  LAYER_12, // = 950,
  LAYER_13, // = 940,
  LAYER_14, // = 930,
  LAYER_15, // = 920,
  LAYER_16, // = 910,
  LAYER_17, // = 900,
}

export abstract class Entity {

  abstract readonly type: EntityType;

  public update(data: any): void {
    for (const key in data) {
      let value = data[key];
      //if (key == "y") {
        // value *= -1;
      //}

      // @ts-ignore
      this[key] = value;
    }
    this.redraw();
  }

  abstract redraw(): void;
  abstract destroy(): void;
  abstract getContainer(): PIXI.Container;
}
