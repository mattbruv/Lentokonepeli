import * as PIXI from "pixi.js";
import { GridSprite } from "./objects/grid";
import { HillSprite } from "./objects/hill";
import { toPixiCoords } from "./helpers";
import { EventManager } from "./event";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "./constants";

/**
 * A class which holds the PIXI object
 * and a renderable representation of game state.
 */
export class GameRenderer {
  public app: PIXI.Application;
  public worldContainer: PIXI.Container;
  public grid: GridSprite;
  public hill: HillSprite;

  private eventManager: EventManager;

  public constructor() {
    this.app = new PIXI.Application({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: 0xf984e5,
      antialias: false
    });

    this.worldContainer = new PIXI.Container();

    this.grid = new GridSprite(this.app.renderer);
    this.hill = new HillSprite();

    this.worldContainer.addChild(this.hill.container);

    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.grid.gridContainer);

    this.eventManager = new EventManager(this);
    this.eventManager.makeInteractive();
  }

  /**
   * Sets the camera to an (x, y) position in PIXI space.
   * @param x PIXI world X position
   * @param y PIXI world Y position
   */
  public setCamera(x: number, y: number): void {
    this.worldContainer.position.set(x, y);
    this.grid.setCamera(x, y);
  }

  /**
   * Centers the camera on a (x, y) position.
   *
   * Coordinates must be in game world space.
   * @param x Game world X position
   * @param y Game world Y position
   */
  public centerCamera(x: number, y: number): void {
    const canvasWidth = this.app.screen.width;
    const canvasHeight = this.app.screen.height;
    const pos = toPixiCoords({ x, y });
    pos.x += Math.round(canvasWidth / 2);
    pos.y += Math.round(canvasHeight / 2);
    this.worldContainer.position.set(pos.x, pos.y);
    this.grid.setCamera(pos.x, pos.y);
  }

  /**
   * Returns the PIXI view
   */
  public getView(): HTMLCanvasElement {
    return this.app.view;
  }

  /**
   * Resizes the view of the canvas
   * and adjusts all game elements accordingly
   */
  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
    this.grid.resizeGrid(width, height);
  }
}
