import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { DrawLayer } from "../constants";
import { Team } from "dogfight-types/Team";
import { ManProperties } from "dogfight-types/ManProperties";

export class Man implements Entity<ManProperties> {
  public props: ManProperties = {};
  private container: PIXI.Container;
  private manSprite: PIXI.Sprite;

  constructor() {
    this.container = new PIXI.Container();
    this.manSprite = new PIXI.Sprite();

    const texture = Textures["parachuter1.gif"];

    this.manSprite.texture = texture;

    // set anchor point at bottom middle
    this.manSprite.anchor.set(0.5, 1);

    this.container.addChild(this.manSprite);

    this.container.zIndex = DrawLayer.LAYER_10_LAYER_12;
  }

  public updateCallbacks: EntityUpdateCallbacks<ManProperties> = {
    client_x: (client_x) => {
      this.manSprite.position.x = client_x;
    },
    client_y: (client_y) => {
      this.manSprite.position.y = client_y;
    },
    team: (team) => {},
    state: (state) => {},
  };

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public destroy() {}
}
