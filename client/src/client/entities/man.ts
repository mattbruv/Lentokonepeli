import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { DrawLayer } from "../constants";
import { Team } from "dogfight-types/Team";
import { ManProperties } from "dogfight-types/ManProperties";

export class Man implements Entity<ManProperties> {
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

  public getContainer(): PIXI.Container {
    return this.container;
  }
  public updateProperties(props: ManProperties): void {
    if (props.client_x !== null) {
      this.manSprite.position.x = props.client_x;
    }

    if (props.client_y !== null) {
      this.manSprite.position.y = props.client_y;
    }

    if (props.team !== null) {
      //
    }
  }

  public destroy() {}
}
