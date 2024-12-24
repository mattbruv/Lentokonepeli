import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { PlayerProperties } from "dogfight-types/PlayerProperties";

export class Player implements Entity<PlayerProperties> {
  public props: Required<PlayerProperties> = {
    clan: null,
    controlling: null,
    name: "Undefined",
    state: "WaitingRespawn",
    team: null
  };

  constructor() { }

  public getContainer(): PIXI.Container {
    return new PIXI.Container();
  }

  public updateCallbacks: EntityUpdateCallbacks<PlayerProperties> = {
    team: () => { },
    name: () => { },
    clan: () => { },
    state: () => { },
    controlling: () => { },
  };

  public destroy() { }
}
