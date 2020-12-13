import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import { Terrain } from "../../../../dogfight/src/constants";
import { getGroundRect } from "../../../../dogfight/src/entities/Ground";

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

  private debug: PIXI.Graphics;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();
    this.x = 0;
    this.y = 0;
    this.terrain = Terrain.Normal;
    this.width = 500;

    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();
    this.debug = new PIXI.Graphics();
    this.debug.zIndex = DrawLayer.Ground;

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
    this.renderablesDebug.push(this.debug);
  }

  private drawDebug(): void {
    const rect = getGroundRect(this.x, this.y, this.width);
    this.debug.clear();
    this.debug.beginFill(0x00ff00);
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    this.debug.drawRect(-halfW, -halfH, rect.width, rect.height);
    this.debug.position.set(rect.center.x, rect.center.y * -1);
    this.debug.endFill();
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
    this.drawDebug();
  }

  public destroy(): void {
    //
  }
}
