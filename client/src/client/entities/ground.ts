import { GroundProperties } from "dogfight-types/GroundProperties";
import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { DrawLayer } from "../constants";

export class Ground implements Entity<GroundProperties> {
  private container: PIXI.Container;
  private groundSprite: PIXI.TilingSprite;

  constructor() {
    this.container = new PIXI.Container();
    const texture = Textures["ground1.gif"];
    this.groundSprite = new PIXI.TilingSprite(texture);
    this.groundSprite.height = texture.height;
    this.container.addChild(this.groundSprite);
    this.container.zIndex = DrawLayer.LAYER_14;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }
  public updateProperties(props: GroundProperties): void {
    if (props.width != null) {
      this.groundSprite.width = props.width;
    }

    if (props.client_x != null) {
      this.groundSprite.x = props.client_x;
    }

    if (props.client_y != null) {
      this.groundSprite.y = props.client_y;
    }

    if (props.terrain !== null) {
      switch (props.terrain) {
        case "Normal": {
          this.groundSprite.texture = Textures["ground1.gif"];
          break;
        }
        case "Desert": {
          this.groundSprite.texture = Textures["groundDesert.gif"];
          break;
        }
      }
    }
  }

  public destroy() {}
}
