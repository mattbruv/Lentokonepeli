import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import { Terrain } from "../../../../dogfight/src/constants";

export class GroundSprite extends GameSprite {
  public x: number;
  public y: number;
  public terrain: Terrain;
  public width: number;

  private spritesheet: PIXI.Spritesheet;

  private container: PIXI.Container;

  private ground: PIXI.TilingSprite;
  private beachLeft: PIXI.Sprite;
  private beachRight: PIXI.Sprite;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();
    this.x = 0;
    this.y = 0;
    this.terrain = Terrain.Normal;
    this.width = 500;

    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();

    this.beachLeft = new PIXI.Sprite(spritesheet.textures["beach-l.gif"]);
    this.beachRight = new PIXI.Sprite(spritesheet.textures["beach-l.gif"]);

    const textureGround: PIXI.Texture = spritesheet.textures["ground1.gif"];

    this.ground = new PIXI.TilingSprite(textureGround);
    this.ground.height = textureGround.height;

    this.container.addChild(this.ground);
    this.container.addChild(this.beachLeft);
    this.container.addChild(this.beachRight);

    this.container.zIndex = DrawLayer.Ground;

    this.renderables.push(this.container);
  }

  public redraw(): void {
    this.ground.width = this.width;
    this.beachRight.scale.x = -1;
    this.beachLeft.position.x = 0;
    this.ground.position.x = this.beachLeft.width;
    this.beachRight.position.x =
      this.ground.position.x + this.ground.width + this.beachRight.width;
    // center ground
    const halfWidth = Math.round(this.container.width / 2);
    this.container.x = this.x - halfWidth;
  }

  public destroy(): void {
    //
  }
}
