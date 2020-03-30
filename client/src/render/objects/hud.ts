import * as PIXI from "pixi.js";
import { GameScreen } from "../constants";
import { Radar } from "./radar";
import { Team } from "../../../../dogfight/src/constants";

const teamPanel = {
  [Team.Centrals]: "metalpanel.jpg",
  [Team.Spectator]: "metalpanel.jpg",
  [Team.Allies]: "woodpanel.jpg"
};

export class GameHud {
  public container: PIXI.Container;

  private enabled: boolean = false;

  private spritesheet: PIXI.Spritesheet;

  private panel: PIXI.Sprite;

  // game components
  public radar: Radar;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.spritesheet = spritesheet;
    this.container = new PIXI.Container();

    // init radar
    this.radar = new Radar(spritesheet);

    const tex = spritesheet.textures["metalpanel.jpg"];
    this.panel = new PIXI.Sprite(tex);
    this.container.addChild(this.panel);
    this.container.addChild(this.radar.container);

    this.container.position.y = GameScreen.Height - tex.height;

    this.setEnabled(true);
  }

  public getPanelHeight(): number {
    return this.panel.height;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(active: boolean): void {
    this.enabled = active;
    this.container.visible = this.enabled;
  }

  public setTeam(side: Team): void {
    const str = teamPanel[side];
    const tex = this.spritesheet.textures[str];
    this.panel.texture = tex;
    this.radar.setTeam(side);
  }
}
