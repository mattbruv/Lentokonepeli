import * as PIXI from "pixi.js";
import { GameScreen } from "../constants";

export class Sky {
  public container: PIXI.Container;
  private skyBox: PIXI.Container;
  private sprite: PIXI.TilingSprite;

  private mask: PIXI.Sprite;
  private skyHeight: number;

  private x: number;
  private y: number;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.x = 0;
    this.y = 0;

    this.container = new PIXI.Container();
    this.skyBox = new PIXI.Container();

    const skyTexture = spritesheet.textures["sky3b.jpg"];

    this.sprite = new PIXI.TilingSprite(skyTexture);
    this.sprite.width = skyTexture.width;
    this.sprite.height = skyTexture.height;

    this.skyHeight = skyTexture.height;
    console.log(this.skyHeight);

    this.mask = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.mask.width = GameScreen.Width;
    this.mask.height = this.skyHeight;

    this.skyBox.addChild(this.sprite);

    this.container.addChild(this.skyBox);
    this.container.addChild(this.mask);
    this.skyBox.mask = this.mask;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public setCamera(x: number, y: number): void {
    this.sprite.tilePosition.set(x, y);
    this.mask.position.y = y;
  }

  public resetZoom(): void {
    this.sprite.tileScale.set(1);
    this.mask.scale.set(1);
    this.mask.width = GameScreen.Width;
    this.mask.height = this.skyHeight;
  }

  public zoom(factor): void {
    this.sprite.tileScale.x *= factor;
    this.sprite.tileScale.y *= factor;

    this.mask.scale.y *= factor;
  }
}
