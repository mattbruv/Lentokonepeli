import { GameRenderer } from "./renderer";
import { toGameCoords } from "./coords";

/**
 * A class which is responsible
 * for handling user interaction
 * with the game canvas.
 */
export class CanvasEventHandler {
  private renderer: GameRenderer;
  private stage: PIXI.Container;
  private dragging: boolean = false;

  private prevX: number;
  private prevY: number;

  public constructor(renderer: GameRenderer) {
    this.renderer = renderer;
    this.stage = this.renderer.getStage();
    this.stage.interactive = true;
  }

  public addListeners(): void {
    // Add button listeners.
    window.addEventListener("keypress", (event: KeyboardEvent): void => {
      switch (event.code) {
        case "KeyD":
          this.renderer.toggleDebugMode();
          break;
        case "KeyR":
          this.renderer.resetZoom();
          break;
        case "KeyX": {
          if (this.renderer.isDebugEnabled()) {
            this.renderer.toggleGrid();
          }
          break;
        }
      }
    });

    this.renderer
      .getView()
      .addEventListener("wheel", (event: WheelEvent): void => {
        if (!this.renderer.isDebugEnabled()) {
          return;
        }
        this.renderer.zoom(event.clientX, event.clientY, event.deltaY < 0);
      });

    // Add mouse listeners.
    this.stage.on(
      "pointermove",
      (event: PIXI.interaction.InteractionEvent): void => {
        if (event.target !== null && this.renderer.isDebugEnabled()) {
          const local = event.data.getLocalPosition(
            this.renderer.worldContainer
          );
          const gameCoords = toGameCoords(local);
          this.renderer.setCursorPosInGame(gameCoords);
        }
        if (this.dragging && this.renderer.isDebugEnabled()) {
          const pos = event.data.global;
          const dx = pos.x - this.prevX;
          const dy = pos.y - this.prevY;
          this.renderer.dragCamera(dx, dy);
          this.prevX = pos.x;
          this.prevY = pos.y;
        }
      }
    );

    // Mousedown/dragging start
    this.stage.on(
      "pointerdown",
      (event: PIXI.interaction.InteractionEvent): void => {
        this.dragging = true;
        this.prevX = event.data.global.x;
        this.prevY = event.data.global.y;
      }
    );

    // Mouseup/dragging stop
    this.stage.on("pointerup", (): void => {
      this.dragging = false;
    });

    // Mouseup/dragging stop outside of canvas.
    this.stage.on("pointerupoutside", (): void => {
      this.dragging = false;
    });
  }
}
