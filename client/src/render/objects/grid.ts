import * as PIXI from "pixi.js";

/**
 * A class which has a grid that better helps see
 * the outlines in the game world.
 */
export class Grid {
  public sprite: PIXI.TilingSprite;

  public constructor() {
    const texture = PIXI.RenderTexture.create({
      width: 100,
      height: 100
    });
    const graphics = new PIXI.Graphics();
    graphics.beginTextureFill(texture, 0x000000);
    graphics.drawRect(0, 0, 50, 100);
    graphics.endFill();
    this.sprite = new PIXI.TilingSprite(texture);
  }
}
