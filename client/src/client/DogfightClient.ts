import * as PIXI from "pixi.js";
import { SKY_COLOR } from "./constants";
import { Viewport } from "pixi-viewport";

export class DogfightClient {
  app: PIXI.Application;
  viewport: Viewport;

  constructor() {
    this.app = new PIXI.Application();
    this.viewport = new Viewport();
    console.log("INIT!");
  }

  async init(div: HTMLDivElement | null) {
    if (div !== null) {
      await this.app.init({
        backgroundColor: SKY_COLOR,
        resizeTo: window,
      });
      div.appendChild(this.app.canvas);
    }
  }
}
