import { GroundProperties } from "dogfight-types/GroundProperties";
import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { CoastProperties } from "dogfight-types/CoastProperties";
import { Facing } from "dogfight-types/Facing";
import { Terrain } from "dogfight-types/Terrain";

type TextureCombinations = {
  [F in Facing]: {
    [T in Terrain]: PIXI.Texture;
  };
};

export class Coast implements Entity<CoastProperties> {
  private container: PIXI.Container;
  private coastSprite: PIXI.Sprite;
  private facing: Facing;

  constructor() {
    this.container = new PIXI.Container();
    const texture = Textures["ground1.gif"];
    this.coastSprite = new PIXI.Sprite(texture);
    this.coastSprite.height = texture.height;
    this.container.addChild(this.coastSprite);
    this.facing = "Left";
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }
  public updateProperties(props: CoastProperties): void {
    if (props.client_x) {
      this.coastSprite.position.set(
        props.client_x,
        this.coastSprite.position.y
      );
    }

    if (props.client_y) {
      this.coastSprite.position.set(100, 100);
    }

    if (props.facing) {
      this.facing = props.facing;
      this.coastSprite.anchor.x = this.facing === "Left" ? 1 : 0;
      this.coastSprite.scale.x = this.facing === "Left" ? 1 : -1;
    }

    if (props.terrain !== null) {
      const tex: TextureCombinations = {
        Right: {
          Normal: Textures["beach-l.gif"],
          Desert: Textures["beach-l_desert.gif"],
        },
        Left: {
          Normal: Textures["beach-l.gif"],
          Desert: Textures["beach-l.gif"],
        },
      };

      this.coastSprite.texture = tex[this.facing][props.terrain];
    }

    console.log(this.coastSprite);
  }

  public destroy() {}
}
