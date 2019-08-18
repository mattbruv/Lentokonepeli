import * as PIXI from "pixi.js";
import { GridSprite } from "./objects/grid";
import { HillSprite } from "./objects/hill";
import { toPixiCoords } from "./helpers";
import { UserEventData } from "./event";

/**
 * A class which holds the PIXI object
 * and state of our current game.
 */
export class GameRenderer {
  private app: PIXI.Application;

  private eventData: UserEventData;

  private worldContainer: PIXI.Container;
  private gridContainer: PIXI.Container;

  private grid: GridSprite;
  private hill: HillSprite;

  public constructor() {
    this.app = new PIXI.Application({
      width: 500,
      height: 500,
      transparent: true,
      antialias: true
    });

    this.eventData = {
      data: null,
      dragging: false
    };

    this.worldContainer = new PIXI.Container();
    this.gridContainer = new PIXI.Container();

    this.grid = new GridSprite(this.app.renderer);
    this.hill = new HillSprite();

    this.gridContainer.addChild(this.grid.gridSprite);
    this.gridContainer.addChild(this.grid.axisSprite);

    this.worldContainer.addChild(this.hill.container);

    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.gridContainer);

    this.makeInteractive();
  }

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

    console.log(this.worldContainer.position);
  }

  public getView(): HTMLCanvasElement {
    return this.app.view;
  }

  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
    this.grid.resizeGrid(width, height);
  }

  private makeInteractive(): void {
    this.app.stage.interactive = true;

    this.app.stage.on(
      "pointerdown",
      (event: PIXI.interaction.InteractionEvent): void => {
        this.eventData.data = event.data;
        this.eventData.dragging = true;
      }
    );

    this.app.stage.on("pointerup", (): void => {
      this.eventData.data = null;
      this.eventData.dragging = false;
    });

    this.app.stage.on("pointerupoutside", (): void => {
      this.eventData.data = null;
      this.eventData.dragging = false;
    });

    this.app.stage.on(
      "pointermove",
      (event: PIXI.interaction.InteractionEvent): void => {
        // console.log(foo.data.global);
        if (!this.eventData.dragging) {
          return;
        }

        console.log("\n\n");
        console.log(event);

        const oldPos = this.eventData.data.global;
        const newPos = event.data.global;
        console.log(oldPos);
        console.log(newPos);
        this.eventData.data = event.data;

        // this.setCamera(newX, newY);
      }
    );
  }
}
