import * as PIXI from "pixi.js";
import { GameScreen } from "../constants";

const GRID_WIDTH = 100;
const GRID_HEIGHT = 100;
const GRID_COLOR = 0x000000;
const GRID_OPACITY = 0.25;

/** The maximum distance in pixels to draw the x,y axis line */
const AXIS_BOUNDS = Math.pow(2, 16 - 1);

export class GridObject {
  public container: PIXI.Container;
  public gridSprite: PIXI.TilingSprite;
  public axisSprite: PIXI.Graphics;

  public constructor(renderer: PIXI.Renderer) {
    const renderTexture = PIXI.RenderTexture.create({
      height: GRID_HEIGHT,
      width: GRID_WIDTH
    });

    const graphics = new PIXI.Graphics();

    graphics.lineStyle(2, GRID_COLOR, 1);
    graphics.beginFill(0x000000, 0);
    graphics.drawRect(0, 0, GRID_HEIGHT, GRID_WIDTH);
    graphics.endFill();
    renderer.render(graphics, renderTexture);

    this.gridSprite = new PIXI.TilingSprite(renderTexture);
    this.gridSprite.width = GameScreen.Width;
    this.gridSprite.height = GameScreen.Height;

    // Draw axes
    this.axisSprite = new PIXI.Graphics();
    this.axisSprite.lineStyle(4, 0x000000, 1);
    this.axisSprite.moveTo(0, AXIS_BOUNDS);
    this.axisSprite.lineTo(0, -AXIS_BOUNDS);
    this.axisSprite.moveTo(AXIS_BOUNDS, 0);
    this.axisSprite.lineTo(-AXIS_BOUNDS, 0);
    this.axisSprite.endFill();

    // Add to main container
    this.container = new PIXI.Container();
    this.container.addChild(this.gridSprite);
    this.container.addChild(this.axisSprite);

    this.gridSprite.alpha = GRID_OPACITY;
    // this.axisSprite.alpha = GRID_OPACITY;
  }

  public setCamera(x: number, y: number): void {
    this.gridSprite.tilePosition.set(x, y);
    this.axisSprite.position.set(x, y);
  }

  public setEnabled(active: boolean): void {
    this.gridSprite.visible = active;
    this.axisSprite.visible = active;
  }
}
