import { GroundProperties } from "dogfight-types/GroundProperties";
import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { DrawLayer, TERRAIN_WATER_COLOR } from "../constants";
import { Terrain } from "dogfight-types/Terrain";

export class Ground implements Entity<GroundProperties> {
  private container: PIXI.Container;
  private groundSprite: PIXI.TilingSprite;
  private water: PIXI.Graphics;

  constructor() {
    this.container = new PIXI.Container();
    const texture = Textures["ground1.gif"];
    this.groundSprite = new PIXI.TilingSprite(texture);
    this.water = new PIXI.Graphics();
    this.groundSprite.height = texture.height;

    this.container.addChild(this.water);
    this.container.addChild(this.groundSprite);

    this.container.zIndex = DrawLayer.LAYER_14;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }
  public updateProps(props: GroundProperties): void {
    if (props.width !== undefined) {
      this.groundSprite.width = props.width;
    }

    if (props.client_x !== undefined) {
      this.groundSprite.x = props.client_x;
      this.water.x = props.client_x;
    }

    if (props.client_y !== undefined) {
      this.groundSprite.y = props.client_y;
      this.water.y = props.client_y;
    }

    if (props.terrain !== undefined) {
      const textureMap: Record<Terrain, PIXI.Texture> = {
        Normal: Textures["ground1.gif"],
        Desert: Textures["groundDesert.gif"],
      };

      this.groundSprite.texture = textureMap[props.terrain];
      const color = TERRAIN_WATER_COLOR[props.terrain];
      this.water.clear();
      this.water.beginFill(color);
      this.water.drawRect(
        0,
        0 + this.groundSprite.height,
        this.groundSprite.width,
        5000
      );
      this.water.endFill();
    }
  }

  public destroy() {}
}
