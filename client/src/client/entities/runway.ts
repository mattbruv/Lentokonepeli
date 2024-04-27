import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { Facing } from "dogfight-types/Facing";
import { DrawLayer, TERRAIN_WATER_COLOR } from "../constants";
import { RunwayProperties } from "dogfight-types/RunwayProperties";

export class Runway implements Entity<RunwayProperties> {
  public props: RunwayProperties = {};
  private container: PIXI.Container;
  private runwaySprite: PIXI.Sprite;
  private runwayBack: PIXI.Sprite;

  public updateCallbacks: EntityUpdateCallbacks<RunwayProperties> = {
    client_x: () => {
      const { client_x } = this.props;
      if (client_x === undefined) return;
      this.runwaySprite.position.x = client_x;
      this.runwayBack.position.x = client_x + 217;
    },
    client_y: () => {
      const { client_y } = this.props;
      if (client_y === undefined) return;
      this.runwaySprite.position.y = client_y;
      this.runwayBack.position.y = client_y;
    },
    facing: () => {
      const { facing } = this.props;
      if (facing === undefined) return;

      const textureMap: Record<Facing, PIXI.Texture> = {
        Left: Textures["runway2.gif"],
        Right: Textures["runway.gif"],
      };
      this.runwaySprite.texture = textureMap[facing];
      this.runwayBack.visible = facing === "Left" ? true : false;
    },
    team: () => {},
  };

  constructor() {
    this.container = new PIXI.Container();
    this.runwaySprite = new PIXI.Sprite();
    this.runwayBack = new PIXI.Sprite(Textures["runway2b.gif"]);
    this.runwayBack.visible = false;
    this.props.facing = "Left";

    this.container.addChild(this.runwayBack);
    this.container.addChild(this.runwaySprite);

    this.container.zIndex = DrawLayer.LAYER_11_LAYER_13;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public destroy() {}
}
