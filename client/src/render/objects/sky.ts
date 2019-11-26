import * as PIXI from "pixi.js";
import { ByteSize } from "../../../../dogfight/src/constants";

export class SkyBackground {
  public container: PIXI.Container;

  private sky: PIXI.TilingSprite;
  private x: number = 0;
  private y: number = 0;

  public constructor(spritesheet: PIXI.Spritesheet) {
    console.log(spritesheet);
    this.container = new PIXI.Container();
    const textureSky: PIXI.Texture = spritesheet.textures["sky3b.jpg"];
    this.sky = new PIXI.TilingSprite(textureSky);
    this.sky.anchor.set(0.5);
    this.sky.height = textureSky.height;
    this.sky.width = ByteSize.TWO_BYTES;
    this.container.addChild(this.sky);
    this.setPosition(0, -250);
  }

  private setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.container.position.set(x, y);
  }

  public setCamera(x: number, y: number): void {
    const iX = x / 6;
    const iY = y / 3;
    this.sky.tilePosition.x = iX;
    this.container.y = this.y - iY;
  }
}
