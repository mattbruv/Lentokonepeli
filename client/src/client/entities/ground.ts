import { GroundProperties } from "dogfight-types/GroundProperties";
import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { DrawLayer, TERRAIN_WATER_COLOR } from "../constants";
import { Terrain } from "dogfight-types/Terrain";

export class Ground implements Entity<GroundProperties> {
  public props: GroundProperties = {};
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

  public updateCallbacks(): EntityUpdateCallbacks<GroundProperties> {
    return {
      client_x: (client_x) => {
        this.groundSprite.x = client_x;
        this.water.x = client_x;
      },
      client_y: (client_y) => {
        this.groundSprite.y = client_y;
        this.water.y = client_y;
      },
      width: (width) => {
        this.groundSprite.width = width;
      },
      terrain: (terrain) => {
        const textureMap: Record<Terrain, PIXI.Texture> = {
          Normal: Textures["ground1.gif"],
          Desert: Textures["groundDesert.gif"],
        };

        this.groundSprite.texture = textureMap[terrain];
        const color = TERRAIN_WATER_COLOR[terrain];
        this.water.clear();
        this.water.beginFill(color);
        this.water.drawRect(
          0,
          0 + this.groundSprite.height,
          this.groundSprite.width,
          5000
        );
        this.water.endFill();
      },
    };
  }

  public updateProps(props: GroundProperties): void {
    if (props.terrain !== undefined) {
    }
  }

  public destroy() {}
}
