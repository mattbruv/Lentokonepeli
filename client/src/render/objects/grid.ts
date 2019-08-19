import * as PIXI from "pixi.js";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "../constants";
import { Vec2d } from "../../../../dogfight/src/physics/vector";

const GRID_WIDTH = 100;
const GRID_HEIGHT = 100;
const GRID_COLOR = 0xbbbbbb;

/** The maximum distance in pixels to draw the x,y axis line */
const AXIS_BOUNDS = Math.pow(2, 16 - 1);

/**
 * A class which has a grid that better helps see
 * the outlines in the game world.
 */
export class GridSprite {
  public gridContainer: PIXI.Container;
  private gridSprite: PIXI.TilingSprite;
  private axisSprite: PIXI.Graphics;
  private cursorPos: Vec2d;
  private cursorText: PIXI.Text;

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
    this.gridSprite.width = SCREEN_WIDTH;
    this.gridSprite.height = SCREEN_HEIGHT;

    // Draw axes
    this.axisSprite = new PIXI.Graphics();
    this.axisSprite.lineStyle(4, 0x000000, 1);
    this.axisSprite.moveTo(0, AXIS_BOUNDS);
    this.axisSprite.lineTo(0, -AXIS_BOUNDS);
    this.axisSprite.moveTo(AXIS_BOUNDS, 0);
    this.axisSprite.lineTo(-AXIS_BOUNDS, 0);

    // add cursor debug text
    this.cursorPos = { x: 0, y: 0 };
    this.cursorText = new PIXI.Text("");
    this.cursorText.position.set(20, 5);

    // Add to main container
    this.gridContainer = new PIXI.Container();
    this.gridContainer.addChild(this.gridSprite);
    this.gridContainer.addChild(this.axisSprite);
    this.gridContainer.addChild(this.cursorText);

    this.gridContainer.alpha = 0.5;
    this.axisSprite.alpha = 0.25;
  }

  public setCamera(x: number, y: number): void {
    this.gridSprite.tilePosition.set(x, y);
    this.axisSprite.position.set(x, y);
  }

  public resizeGrid(width: number, height: number): void {
    this.gridSprite.width = width;
    this.gridSprite.height = height;
  }

  public setCursorCoords(x: number, y: number): void {
    this.cursorPos = { x, y };
    this.updateCursorText();
  }

  private updateCursorText(): void {
    this.cursorText.text =
      "x: " + this.cursorPos.x + " \ny: " + this.cursorPos.y;
  }
}
