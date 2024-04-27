import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { PlayerProperties } from "dogfight-types/PlayerProperties";

export class Player implements Entity<PlayerProperties> {
  private props: PlayerProperties = {};

  constructor() {}

  public getContainer(): PIXI.Container {
    return new PIXI.Container();
  }

  public updateProps(props: PlayerProperties): void {
    console.log("before:", this.props);
    this.props = {
      ...this.props,
      ...props,
    };
    console.log(props);
    console.log("after: ", this.props);

    if (props.clan !== undefined) {
    }

    if (props.name !== undefined) {
    }
  }

  public destroy() {}
}
