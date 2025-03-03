import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { ControllingEntity } from "dogfight-types/ControllingEntity";
import { Team } from "dogfight-types/Team";

type OnChangeControl = (previous: ControllingEntity | null, next: ControllingEntity | null, props: PlayerProperties) => void

export class Player implements Entity<PlayerProperties> {
  public props: Required<PlayerProperties> = {
    guid: "",
    clan: null,
    controlling: null,
    name: "Undefined",
    state: "WaitingRespawn",
    team: null
  };

  private onChange: OnChangeControl

  constructor(onControlChange: OnChangeControl) {
    this.onChange = onControlChange
  }

  public getContainer(): PIXI.Container {
    return new PIXI.Container();
  }

  public updateCallbacks: EntityUpdateCallbacks<PlayerProperties> = {
    team: () => { },
    name: () => { },
    clan: () => { },
    state: () => { },
    guid: () => { },
    controlling: (oldProps) => {
      if (oldProps.controlling !== undefined)
        this.onChange(oldProps.controlling, this.props.controlling, this.props)
    },
  };

  public destroy() { }
}
