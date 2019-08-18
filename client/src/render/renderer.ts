import * as PIXI from "pixi.js";
import { GridSprite } from "./objects/grid";
import { HillSprite } from "./objects/hill";
import { toPixiCoords, toGameCoords } from "./helpers";
import { MouseClickEvent } from "./event";

/**
 * A class which holds the PIXI object
 * and state of our current game.
 */
export class GameRenderer {
  private app: PIXI.Application;

  private mouseClick: MouseClickEvent;

  private worldContainer: PIXI.Container;

  private grid: GridSprite;
  private hill: HillSprite;

  public constructor() {
    this.app = new PIXI.Application({
      width: 500,
      height: 500,
      transparent: true,
      antialias: false
    });

    this.mouseClick = {
      clickPos: { x: 0, y: 0 },
      dragging: false
    };

    this.worldContainer = new PIXI.Container();

    this.grid = new GridSprite(this.app.renderer);
    this.hill = new HillSprite();

    this.worldContainer.addChild(this.hill.container);

    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.grid.gridContainer);

    this.makeInteractive();
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
        this.mouseClick.clickPos = {
          x: event.data.global.x,
          y: event.data.global.y
        };
        this.mouseClick.dragging = true;
      }
    );

    this.app.stage.on("pointerup", (): void => {
      this.mouseClick.dragging = false;
    });

    this.app.stage.on("pointerupoutside", (): void => {
      this.mouseClick.dragging = false;
    });

    this.app.stage.on(
      "pointermove",
      (event: PIXI.interaction.InteractionEvent): void => {
        const foo = event.data.getLocalPosition(this.worldContainer);
        const cursor = toGameCoords(foo);
        this.grid.setCursorCoords(cursor.x, cursor.y);
        if (this.mouseClick.dragging) {
          const pos = event.data.global;
          const prev = this.mouseClick.clickPos;
          const worldPos = this.worldContainer.position;
          const dx = pos.x - prev.x;
          const dy = pos.y - prev.y;
          const camX = Math.round(worldPos.x + dx);
          const camY = Math.round(worldPos.y + dy);
          this.setCamera(camX, camY);
          this.mouseClick.clickPos = {
            x: pos.x,
            y: pos.y
          };
        }
      }
    );
  }
}
