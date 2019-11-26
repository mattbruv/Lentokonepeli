import * as PIXI from "pixi.js";
import { GameScreen } from "../constants";

export class Sky {
  public container: PIXI.Container;
  private sprite: PIXI.TilingSprite;

  private mask: PIXI.Sprite;
  private skyHeight: number;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.container = new PIXI.Container();

    const skyTexture = spritesheet.textures["sky3b.jpg"];
    this.skyHeight = skyTexture.height;

    this.sprite = new PIXI.TilingSprite(skyTexture);
    this.sprite.width = skyTexture.width;
    this.sprite.height = skyTexture.height;

    this.mask = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.mask.width = GameScreen.Width;
    this.mask.height = this.skyHeight;

    this.container.addChild(this.sprite);
    this.container.addChild(this.mask);
    this.sprite.mask = this.mask;
  }

  public setCamera(x: number, y: number): void {
    this.container.position.set(x, y);
    this.sprite.tilePosition.set(x, y);
    this.mask.position.y = y;
    /*
    const iX = x / 6;
    //paramGraphics2D.drawImage(image, i, this.y + paramInt2, null);
    //paramGraphics2D.drawImage(image, i - image.getWidth(), this.y + paramInt2, null);
    this.sprite.tilePosition.x = iX;
    // this.sprite.tilePosition.y = y;
    // this.mask.position.y = y;
    */
    /*
        public setCamera(x: number, y: number): void {
          this.gridSprite.tilePosition.set(x, y);
          this.axisSprite.position.set(x, y);
        }
    */
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
