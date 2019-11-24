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

  /*
    The following may be needed to get click relative to canvas position in window:
    this.canvas.getBoundingClientRect();
  */
  public addListeners(): void {
    console.log("bound listners!");
    this.canvas.addEventListener("mousedown", (event: MouseEvent): void => {
      console.log(event);
    });

    this.canvas.addEventListener("mousemove", (event: MouseEvent): void => {
      this.renderer.mouseOver(event);
    });
  }
}
