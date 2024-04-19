import * as PIXI from "pixi.js";
import { SKY_COLOR } from "./constants";
import { Viewport } from "pixi-viewport";

export class DogfightClient {
  // https://pixijs.download/v7.x/docs/index.html
  private app: PIXI.Application<HTMLCanvasElement>;
  private viewport: Viewport;

  constructor() {
    this.app = new PIXI.Application<HTMLCanvasElement>({
      backgroundColor: SKY_COLOR,
    });

    this.viewport = new Viewport({
      events: this.app.renderer.events,
    });

    this.app.stage.addChild(this.viewport);
  }

  public appendView(element: HTMLDivElement | null) {
    element?.appendChild(this.app.view);
  }
}
