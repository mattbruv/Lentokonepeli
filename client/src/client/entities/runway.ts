import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { Facing } from "dogfight-types/Facing";
import { DrawLayer, TERRAIN_WATER_COLOR } from "../constants";
import { RunwayProperties } from "dogfight-types/RunwayProperties";

export class Runway implements Entity<RunwayProperties> {
  private container: PIXI.Container;
  private runwaySprite: PIXI.Sprite;
  private runwayBack: PIXI.Sprite;
  private facing: Facing;

  constructor() {
    this.container = new PIXI.Container();
    this.runwaySprite = new PIXI.Sprite();
    this.runwayBack = new PIXI.Sprite(Textures["runway2b.gif"]);
    this.runwayBack.visible = false;
    this.facing = "Left";

    this.container.addChild(this.runwayBack);
    this.container.addChild(this.runwaySprite);

    this.container.zIndex = DrawLayer.LAYER_11_LAYER_13;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }
  public updateProperties(props: RunwayProperties): void {
    if (props.client_x != null) {
      this.runwaySprite.position.x = props.client_x;
      this.runwayBack.position.x = props.client_x + 217;
    }

    if (props.client_y != null) {
      this.runwaySprite.position.y = props.client_y;
      this.runwayBack.position.y = props.client_y;
    }

    if (props.facing != null) {
      const textureMap: Record<Facing, PIXI.Texture> = {
        Left: Textures["runway2.gif"],
        Right: Textures["runway.gif"],
      };
      this.facing = props.facing;
      this.runwaySprite.texture = textureMap[props.facing];
      this.runwayBack.visible = this.facing === "Left" ? true : false;
    }
  }

  public destroy() {}
}
