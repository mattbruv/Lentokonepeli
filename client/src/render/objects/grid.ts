import * as PIXI from "pixi.js";

const GRID_WIDTH = 100;
const GRID_HEIGHT = 100;
const GRID_COLOR = 0xbbbbbb;

/** The maximum distance in pixels to draw the x,y axis line */
const AXIS_BOUNDS = 50000;

/**
 * A class which has a grid that better helps see
 * the outlines in the game world.
 */
export class GridSprite {
  public gridSprite: PIXI.TilingSprite;
  public axisSprite: PIXI.Graphics;

  public constructor(renderer: PIXI.Renderer) {
    const renderTexture = PIXI.RenderTexture.create({
      height: GRID_HEIGHT,
      width: GRID_WIDTH
    });
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(1, GRID_COLOR, 1);
    graphics.beginFill(0x000000, 0);
    graphics.drawRect(0, 0, GRID_HEIGHT, GRID_WIDTH);
    graphics.endFill();
    renderer.render(graphics, renderTexture);
    this.gridSprite = new PIXI.TilingSprite(renderTexture);

    // Draw axes
    this.axisSprite = new PIXI.Graphics();
    this.axisSprite.lineStyle(3, 0x000000, 1);
    this.axisSprite.moveTo(0, AXIS_BOUNDS);
    this.axisSprite.lineTo(0, -AXIS_BOUNDS);
    this.axisSprite.moveTo(AXIS_BOUNDS, 0);
    this.axisSprite.lineTo(-AXIS_BOUNDS, 0);
  }

  public setCamera(x: number, y: number): void {
    this.gridSprite.tilePosition.set(x, y);
    this.axisSprite.position.set(x, y);
  }

  public resizeGrid(width: number, height: number): void {
    this.gridSprite.width = width;
    this.gridSprite.height = height;
  }
}
