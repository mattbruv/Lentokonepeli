import * as PIXI from "pixi.js";
import { GameScreen } from "../constants";
import { Vec2d } from "../../../../dogfight/src/physics/vector";
import { toPixiCoords } from "../coords";

const GRID_WIDTH = 100;
const GRID_HEIGHT = 100;
const GRID_COLOR = 0x000000;
const GRID_OPACITY = 0.25;

const DOT_SIZE = 5;
const DOT_COLOR = 0x666666;

/** The maximum distance in pixels to draw the x,y axis line */
const AXIS_BOUNDS = Math.pow(2, 16 - 1);

export class GridObject {
  public container: PIXI.Container;
  public gridSprite: PIXI.TilingSprite;
  public axisSprite: PIXI.Graphics;

  // grid snap dot
  private dot: PIXI.Graphics;

  public constructor(renderer: PIXI.Renderer) {
    const renderTexture = PIXI.RenderTexture.create({
      height: GRID_HEIGHT,
      width: GRID_WIDTH
    });

    this.dot = new PIXI.Graphics();
    this.dot.beginFill(DOT_COLOR);
    this.dot.drawCircle(0, 0, DOT_SIZE);
    this.dot.endFill();

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
    // remove the dot for now until fixed.
    // this.container.addChild(this.dot);

    this.gridSprite.alpha = GRID_OPACITY;
    // this.axisSprite.alpha = GRID_OPACITY;
  }

  // returns corner to snap dot to, or nothing.
  // Snaps when within 10% of an edge in x and y
  public getDot(gameCoords: Vec2d): Vec2d {
    // if pos within 10%, snap to closest edge
    const closestX = Math.round(gameCoords.x / GRID_HEIGHT) * GRID_HEIGHT;
    const closestY = Math.round(gameCoords.y / GRID_HEIGHT) * GRID_HEIGHT;
    const diffX = Math.abs(closestX - gameCoords.x);
    const diffY = Math.abs(closestY - gameCoords.y);
    const nX = diffX <= 10 ? closestX : gameCoords.x;
    const nY = diffY <= 10 ? closestY : gameCoords.y;
    return { x: nX, y: nY };
  }

  public setDot(gameCoords: Vec2d): void {
    const pos = toPixiCoords(gameCoords);
    console.log(pos);

    this.dot.position.set(pos.x, pos.y);
  }

  public setCamera(x: number, y: number): void {
    this.gridSprite.tilePosition.set(x, y);
    this.axisSprite.position.set(x, y);
  }

  public setEnabled(active: boolean): void {
    this.gridSprite.visible = active;
    this.axisSprite.visible = active;
    this.dot.visible = active;
  }
}
