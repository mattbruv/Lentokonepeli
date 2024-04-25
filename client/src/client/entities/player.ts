import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { PlayerProperties } from "dogfight-types/PlayerProperties";

export class Player implements Entity<PlayerProperties> {
  constructor() {}

  public getContainer(): PIXI.Container {
    return new PIXI.Container();
  }

  public updateProperties(props: PlayerProperties): void {
    if (props.clan !== undefined) {
    }

    if (props.name !== undefined) {
    }
  }

  public destroy() {}
}
