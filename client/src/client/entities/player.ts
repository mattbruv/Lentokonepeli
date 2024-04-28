import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { PlayerProperties } from "dogfight-types/PlayerProperties";

export class Player implements Entity<PlayerProperties> {
  public props: PlayerProperties = {};

  constructor() {}

  public getContainer(): PIXI.Container {
    return new PIXI.Container();
  }

  public updateCallbacks: EntityUpdateCallbacks<PlayerProperties> = {
    team: () => {},
    name: () => {},
    clan: () => {},
    state: () => {},
  };

  public destroy() {}
}
