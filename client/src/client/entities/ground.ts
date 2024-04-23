import { GroundProperties } from "dogfight-types/GroundProperties";
import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";

export class Ground implements Entity<GroundProperties> {
  private container: PIXI.Container;
  private groundSprite: PIXI.TilingSprite;

  constructor() {
    this.container = new PIXI.Container();
    const texture = Textures["ground1.gif"];
    this.groundSprite = new PIXI.TilingSprite(texture);
    this.groundSprite.height = texture.height;
    this.container.addChild(this.groundSprite);
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }
  public updateProperties(props: GroundProperties): void {
    if (props.width) {
      this.groundSprite.width = props.width;
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
