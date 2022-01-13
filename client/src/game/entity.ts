import * as PIXI from "pixi.js";
import { EntityType } from "../network/game/EntityType";

export enum Direction {
  LEFT,
  RIGHT,
}

export enum BackgroundItemType {
    NORMAL_TOWER,
    DESERT_TOWER,
    PALM_TREE,
}

export enum TerrainType {
  NORMAL,
  DESERT,
}

export enum Team {
  CENTRALS,
  ALLIES,
  NEUTRAL,
}

// in PIXI.js, a higher value = closer to camera

// in original game:

// RUNWAY =  > 14
// ground = 14 ABOVE WATER
// water = 11  BEHIND GROUND


export enum DrawLayer {
  Hill = -120,
  Water = -100,
  Flag = -70,
  ControlTower = -60,
  Ground = -50,
  RunwayBack = -10,
  LightSmoke = -7,
  Plane = -5,
  DarkSmoke = -3,
  Runway = 0,
  Trooper = 5,
  Explosion = 50,
  Bomb = 60,
  Bullet = 69,
  Player = 100
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
