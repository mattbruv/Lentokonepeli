import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { DrawLayer } from "../constants";
import { HillProperties } from "dogfight-types/HillProperties";
import { Textures } from "../textures";

export class Hill implements Entity<HillProperties> {

  props: Required<HillProperties> = {
    terrain: "Normal",
    client_x: 0,
    client_y: 0,
  };

  private container: PIXI.Container;
  private hillSprite: PIXI.Sprite;

  constructor() {
    this.container = new PIXI.Container();
    this.hillSprite = new PIXI.Sprite(Textures["hill1.gif"]);

    this.container.addChild(this.hillSprite);

    this.container.zIndex = DrawLayer.Hill;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public updateCallbacks: EntityUpdateCallbacks<HillProperties> = {
    terrain: () => {
    },
    client_x: () => {
      this.hillSprite.position.x = this.props.client_x
    },
    client_y: () => {
      this.hillSprite.position.y = this.props.client_y
    },
  };

  public destroy() { }
}
