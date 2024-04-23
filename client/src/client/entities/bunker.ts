import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { DrawLayer } from "../constants";
import { BunkerProperties } from "dogfight-types/BunkerProperties";
import { Team } from "dogfight-types/Team";

export class Bunker implements Entity<BunkerProperties> {
  private container: PIXI.Container;
  private bunker: PIXI.Sprite;

  constructor() {
    this.container = new PIXI.Container();
    this.bunker = new PIXI.Sprite();

    this.container.addChild(this.bunker);

    this.container.zIndex = DrawLayer.LAYER_09;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }
  public updateProperties(props: BunkerProperties): void {
    console.log(props);
    if (props.x !== null) {
      this.bunker.position.x = props.x;
    }

    if (props.y !== null) {
      this.bunker.position.y = props.y;
    }

    if (props.team !== null) {
      const textures: Record<Team, PIXI.Texture> = {
        Centrals: Textures["headquarter_germans.gif"],
        Allies: Textures["headquarter_raf.gif"],
      };

      this.bunker.texture = textures[props.team];
    }
  }

  public destroy() {}
}
