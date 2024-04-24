import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { CoastProperties } from "dogfight-types/CoastProperties";
import { Facing } from "dogfight-types/Facing";
import { Terrain } from "dogfight-types/Terrain";
import { DrawLayer, TERRAIN_WATER_COLOR } from "../constants";

type TextureCombinations = {
  [F in Facing]: {
    [T in Terrain]: PIXI.Texture;
  };
};

export class Coast implements Entity<CoastProperties> {
  private container: PIXI.Container;
  private coastSprite: PIXI.Sprite;
  private water: PIXI.Graphics;
  private facing: Facing;

  constructor() {
    this.container = new PIXI.Container();
    const texture = Textures["ground1.gif"];
    this.coastSprite = new PIXI.Sprite();
    this.coastSprite.height = texture.height;
    this.water = new PIXI.Graphics();
    this.facing = "Left";

    this.container.addChild(this.water);
    this.container.addChild(this.coastSprite);
    this.container.zIndex = DrawLayer.LAYER_10;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }
  public updateProperties(props: CoastProperties): void {
    if (props.client_x != null) {
      this.coastSprite.position.x = props.client_x;
      this.water.position.x = props.client_x;
    }

    if (props.client_y != null) {
      this.coastSprite.position.y = props.client_y;
      this.water.position.y = props.client_y;
    }

    if (props.facing != null) {
      this.facing = props.facing;
      this.coastSprite.anchor.x = this.facing === "Left" ? 0 : 1;
      this.coastSprite.scale.x = this.facing === "Left" ? 1 : -1;
    }

    if (props.terrain !== undefined) {
      const tex: TextureCombinations = {
        // none of the beach-r textures are used in the game.
        // They are actually just the left ones, but inverted
        Right: {
          Normal: Textures["beach-l.gif"],
          Desert: Textures["beach-l_desert.gif"],
        },
        Left: {
          Normal: Textures["beach-l.gif"],
          Desert: Textures["beach-l_desert.gif"],
        },
      };

      this.coastSprite.texture = tex[this.facing][props.terrain];

      // draw water
      this.water.clear();

      this.water.beginFill(TERRAIN_WATER_COLOR[props.terrain]);

      this.water.drawRect(
        0,
        this.coastSprite.height,
        this.coastSprite.width,
        5000
      );

      this.water.endFill();
    }
  }

  public destroy() {}
}
