import * as PIXI from "pixi.js";

export class GameRenderer {
  public app: PIXI.Application;
  public world: PIXI.Container;

  public constructor() {
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0xf984e5,
      antialias: false
    });

    window.addEventListener("resize", (): void => {
      this.resize(window.innerWidth, window.innerHeight);
    });
  }

  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }
}
