import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { EntityType } from "../../../../dogfight/src/entity";
import { Properties } from "../../../../dogfight/src/state";

export class GroundSprite implements GameSprite {
  public entityId: number;
  public entityType = EntityType.Ground;
  public container: PIXI.Container;
  public debugContainer: PIXI.Container;

  private ground: PIXI.TilingSprite;

  public constructor(spritesheet: PIXI.Spritesheet, id: number) {
    this.entityId = id;
    console.log(spritesheet);
    this.container = new PIXI.Container();
    this.debugContainer = new PIXI.Container();
    console.log("create ground sprite!");
    const textureGround: PIXI.Texture = spritesheet.textures["ground1.gif"];
    this.ground = new PIXI.TilingSprite(textureGround);
    this.ground.height = textureGround.height;
    this.ground.position.set(0, 0);
    this.container.addChild(this.ground);
  }

  public update(props: Properties): void {
    if (props.width) {
      this.ground.width = props.width;
    }
    console.log("update this entity with: ", props);
  }
}
