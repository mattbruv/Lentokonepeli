import * as PIXI from "pixi.js";
import { SKY_COLOR } from "./constants";
import { Viewport } from "pixi-viewport";

export class DogfightClient {
  app: PIXI.Application;
  viewport: Viewport;

  constructor() {
    this.app = new PIXI.Application();
    this.viewport = new Viewport();
  }

  async init() {
    await this.app.init({
      backgroundColor: SKY_COLOR,
    });
  }
}
