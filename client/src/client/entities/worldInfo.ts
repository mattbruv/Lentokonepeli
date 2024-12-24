import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { WorldInfoProperties } from "dogfight-types/WorldInfoProperties";

export class WorldInfo implements Entity<WorldInfoProperties> {
  public props: WorldInfoProperties = {};

  constructor() { }

  public getContainer(): PIXI.Container {
    return new PIXI.Container();
  }

  public updateCallbacks: EntityUpdateCallbacks<WorldInfoProperties> = {
    state: () => { },
    winner: () => { },
  };

  public destroy() { }
}
