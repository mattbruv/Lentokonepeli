import * as PIXI from "pixi.js";
import { Textures } from "./textures";
import { GameClientCallbacks } from "./DogfightClient";

export class RunwaySelector {
  public container: PIXI.Container;

  public infoBox: PIXI.Sprite;
  public planeImage: PIXI.Sprite;

  constructor() {
    this.container = new PIXI.Container();

    this.infoBox = new PIXI.Sprite();
    this.planeImage = new PIXI.Sprite();

    this.container.addChild(this.infoBox);
    this.container.addChild(this.planeImage);
  }

  public init(callbacks: GameClientCallbacks) {
    this.infoBox.texture = Textures["selectionScreen.gif"];
  }
}
