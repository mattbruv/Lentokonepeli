import * as PIXI from "pixi.js";
import { SKY_COLOR } from "./constants";
import { Viewport } from "pixi-viewport";

export class DogfightClient {
  app: PIXI.Application<HTMLCanvasElement>;
  viewport: Viewport;

  constructor() {
    this.app = new PIXI.Application<HTMLCanvasElement>({
      backgroundColor: SKY_COLOR,
    });

    this.viewport = new Viewport({
      events: this.app.renderer.events,
    });
  }

  public appendView(element: HTMLDivElement | null) {
    element?.appendChild(this.app.view);
  }
}
