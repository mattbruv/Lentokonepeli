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

  private x: number;
  private width: number;

  public constructor(spritesheet: PIXI.Spritesheet, id: number) {
    this.entityId = id;

    this.container = new PIXI.Container();
    this.beachLeft = new PIXI.Sprite(spritesheet.textures["beach-l.gif"]);
    this.beachRight = new PIXI.Sprite(spritesheet.textures["beach-l.gif"]);
    this.debugContainer = new PIXI.Container();

    const textureGround: PIXI.Texture = spritesheet.textures["ground1.gif"];

    this.ground = new PIXI.TilingSprite(textureGround);
    this.ground.height = textureGround.height;

    this.container.addChild(this.ground);
    this.container.addChild(this.beachLeft);
    this.container.addChild(this.beachRight);

    this.container.zIndex = DrawLayer.Ground;

    this.draw();
  }

  public update(props: Properties): void {
    if (props.width !== undefined) {
      this.width = props.width;
    }
    if (props.x !== undefined) {
      this.x = props.x;
    }
    this.draw();
  }

  private draw(): void {
    // set width
    this.ground.width = this.width;
    // position beaches
    this.beachRight.scale.x = -1;
    this.beachLeft.position.x = 0;
    this.ground.position.x = this.beachLeft.width;
    this.beachRight.position.x =
      this.ground.position.x + this.ground.width + this.beachRight.width;
    // center ground
    const halfWidth = Math.round(this.container.width / 2);
    this.container.x = this.x - halfWidth;
  }

  public destroy(): void {}
}
