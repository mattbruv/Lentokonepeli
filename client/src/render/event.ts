import { GameRenderer } from "./renderer";

/**
 * A class which is responsible
 * for handling user interaction
 * with the game canvas.
 */
export class CanvasEventHandler {
  private renderer: GameRenderer;
  private canvas: HTMLCanvasElement;

  public constructor(renderer: GameRenderer) {
    this.renderer = renderer;
    this.canvas = this.renderer.getView();
  }

  public addListeners(): void {
    console.log("bound listners!");
    this.canvas.addEventListener("mousedown", (event: MouseEvent): void => {
      console.log(event);
    });
  }
}
