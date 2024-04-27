import * as PIXI from "pixi.js";
import { Textures } from "./textures";
import { GameClientCallbacks } from "./DogfightClient";
import { Team } from "dogfight-types/Team";

export class GameHUD {
  public container: PIXI.Container;

  private panel: PIXI.Sprite;

  constructor() {
    this.container = new PIXI.Container();

    this.panel = new PIXI.Sprite();

    this.container.addChild(this.panel);
  }

  public init() {
    this.panel.texture = Textures["metalpanel.jpg"];
  }

  public setTeam(team?: Team) {
    if (team === undefined || team === "Centrals") {
      this.panel.texture = Textures["metalpanel.jpg"];
    }
    if (team === "Allies") {
      this.panel.texture = Textures["woodpanel.jpg"];
    }
  }
}
