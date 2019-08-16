import * as PIXI from "pixi.js";
import { Grid } from "./objects/grid";

/**
 * A class which holds the PIXI object
 * and state of our current game.
 */
export class GameRenderer {
  private app: PIXI.Application;
  private worldContainer: PIXI.Container;
  private grid: Grid;

  public constructor() {
    this.app = new PIXI.Application({
      width: 500,
      height: 500,
      transparent: true,
      antialias: true
    });

    this.worldContainer = new PIXI.Container();
    this.grid = new Grid();

    this.worldContainer.addChild(this.grid.sprite);
    this.app.stage.addChild(this.worldContainer);
  }

  public getView(): HTMLCanvasElement {
    return this.app.view;
  }

  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }
}
