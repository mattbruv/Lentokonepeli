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

  public constructor(renderer: GameRenderer) {
    this.renderer = renderer;
    this.stage = this.renderer.getStage();
    this.stage.interactive = true;
  }

  /*
    The following may be needed to get click relative to canvas position in window:
    this.canvas.getBoundingClientRect();
  */
  public addListeners(): void {
    console.log("bound listners!");

    // Add button listeners.
    window.addEventListener("keypress", (event: KeyboardEvent): void => {
      if (event.code == "KeyD") {
        this.renderer.toggleDebugMode();
      }
    });

    // Add mouse listeners.
    this.stage.on(
      "pointermove",
      (event: PIXI.interaction.InteractionEvent): void => {
        if (event.target !== null) {
          const local = event.data.getLocalPosition(
            this.renderer.worldContainer
          );
          const gamePos = toGameCoords(local);
          this.renderer.setCursorPosInGame(gamePos);
        }
      }
    );
    /*
    this.canvas.addEventListener("mousedown", (event: MouseEvent): void => {
      console.log(event);
    });

    this.canvas.addEventListener("mousemove", (event: MouseEvent): void => {
      this.renderer.mouseOver(event);
    });
    */
  }
}
