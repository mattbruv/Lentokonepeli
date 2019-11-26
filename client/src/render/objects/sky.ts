import * as PIXI from "pixi.js";
import { GameScreen } from "../constants";

export class Sky {
  public container: PIXI.Container;
  private sprite: PIXI.TilingSprite;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.container = new PIXI.Container();
    const skyTexture = spritesheet.textures["sky3b.jpg"];
    this.sprite = new PIXI.TilingSprite(skyTexture);
    this.sprite.width = GameScreen.Width;
    this.sprite.height = GameScreen.Height;

    this.container.addChild(this.sprite);
  }

  public setCamera(x: number, y: number): void {
    this.sprite.tilePosition.set(x, y);
  }

  public resetZoom(): void {
    this.sprite.tileScale.set(1);
  }

  public zoom(factor): void {
    this.sprite.tileScale.x *= factor;
    this.sprite.tileScale.y *= factor;
  }
}
