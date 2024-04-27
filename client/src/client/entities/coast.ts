import { Entity, EntityUpdateCallbacks } from "./entity";
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
  public props: CoastProperties = {};
  private container: PIXI.Container;
  private coastSprite: PIXI.Sprite;
  private water: PIXI.Graphics;

  constructor() {
    this.container = new PIXI.Container();
    const texture = Textures["ground1.gif"];
    this.coastSprite = new PIXI.Sprite();
    this.coastSprite.height = texture.height;
    this.water = new PIXI.Graphics();

    this.container.addChild(this.water);
    this.container.addChild(this.coastSprite);
    this.container.zIndex = DrawLayer.LAYER_10;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public updateCallbacks: EntityUpdateCallbacks<CoastProperties> = {
    client_x: () => {
      const { client_x } = this.props;
      if (client_x === undefined) return;
      this.coastSprite.position.x = client_x;
      this.water.position.x = client_x;
    },
    client_y: () => {
      const { client_y } = this.props;
      if (client_y === undefined) return;
      this.coastSprite.position.y = client_y;
      this.water.position.y = client_y;
    },
    facing: () => {
      const { facing } = this.props;
      if (facing === undefined) return;
      this.coastSprite.anchor.x = facing === "Left" ? 0 : 1;
      this.coastSprite.scale.x = facing === "Left" ? 1 : -1;
    },
    terrain: () => this.updateTerrain(),
  };

  private updateTerrain() {
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

    if (!this.props.facing) return;
    if (!this.props.terrain) return;
    this.coastSprite.texture = tex[this.props.facing][this.props.terrain];

    // draw water
    this.water.clear();

    this.water.beginFill(TERRAIN_WATER_COLOR[this.props.terrain]);

    this.water.drawRect(
      0,
      this.coastSprite.height,
      this.coastSprite.width,
      5000
    );

    this.water.endFill();
  }

  public destroy() {}
}
