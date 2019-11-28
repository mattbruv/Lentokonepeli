import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { EntityType } from "../../../../dogfight/src/entity";
import { Properties } from "../../../../dogfight/src/state";
import { DrawLayer } from "../constants";

export class GroundSprite implements GameSprite {
  public entityId: number;
  public entityType = EntityType.Ground;
  public container: PIXI.Container;
  public debugContainer: PIXI.Container;

  private ground: PIXI.TilingSprite;
  private beachLeft: PIXI.Sprite;
  private beachRight: PIXI.Sprite;

  public constructor(spritesheet: PIXI.Spritesheet, id: number) {
    console.log("create ground sprite!");
    this.entityId = id;

    this.container = new PIXI.Container();
    this.beachLeft = new PIXI.Sprite(spritesheet.textures["beach-l.gif"]);
    this.beachRight = new PIXI.Sprite(spritesheet.textures["beach-l.gif"]);
    this.debugContainer = new PIXI.Container();

    const textureGround: PIXI.Texture = spritesheet.textures["ground1.gif"];

    this.ground = new PIXI.TilingSprite(textureGround);
    this.ground.height = textureGround.height;

    this.updatePosition();

    this.container.addChild(this.ground);
    this.container.addChild(this.beachLeft);
    this.container.addChild(this.beachRight);

    this.container.zIndex = DrawLayer.Ground;
  }

  private updatePosition(): void {
    this.beachRight.scale.x = -1;
    this.beachLeft.position.x = 0;
    this.ground.position.x = this.beachLeft.width;
    this.beachRight.position.x =
      this.ground.position.x + this.ground.width + this.beachRight.width;
  }

  private center(newX: number): void {
    const halfWidth = Math.round(this.container.width / 2);
    this.container.x = newX - halfWidth;
    //this.container.x = 0;
  }

  public update(props: Properties): void {
    console.log("update this entity with: ", props);
    if (props.width !== undefined) {
      this.ground.width = props.width;
    }
    this.updatePosition();
    if (props.x !== undefined) {
      this.center(props.x);
    }
  }

  public destroy(): void {}
}
