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
    clan: (clan) => {},
    name: (name) => {},
    team: (team) => {
      console.log("player's team changed!");
    },
  };

  public getProps(): Readonly<PlayerProperties> {
    return this.props;
  }

  public destroy() {}
}
