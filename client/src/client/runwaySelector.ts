import * as PIXI from "pixi.js";
import { Textures } from "./textures";
import { GameClientCallbacks } from "./DogfightClient";
import { PlaneType } from "dogfight-types/PlaneType";
import { Team } from "dogfight-types/Team";

type PlaneData = {
  plane_type: PlaneType;
  texture: PIXI.Texture;
};

type PlaneMap = Record<Team, PlaneData[]>;

export class RunwaySelector {
  public container: PIXI.Container;

  public infoBox: PIXI.Sprite;
  public planeImage: PIXI.Sprite;

  public planeMap: PlaneMap;

  constructor() {
    this.container = new PIXI.Container();

    this.infoBox = new PIXI.Sprite();
    this.planeImage = new PIXI.Sprite();

    this.container.addChild(this.infoBox);
    this.container.addChild(this.planeImage);
    this.container.visible = false;

    this.planeImage.position.set(10);

    this.planeMap = {
      Allies: [],
      Centrals: [],
    };
  }

  public init(callbacks: GameClientCallbacks) {
    this.infoBox.texture = Textures["selectionScreen.gif"];

    this.planeImage.texture = Textures["pic_plane4.gif"];
  }
}
