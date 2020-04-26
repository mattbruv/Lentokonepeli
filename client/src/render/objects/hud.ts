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

  private infoBars: PIXI.Graphics;
  private bombs: PIXI.Container;

  // game components
  public radar: Radar;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.spritesheet = spritesheet;
    this.container = new PIXI.Container();

    // init radar
    this.radar = new Radar(spritesheet);
    this.infoBars = new PIXI.Graphics();
    this.bombs = new PIXI.Container();

    // add bomb images
    for (let i = 0; i < 5; i++) {
      const tex = this.spritesheet.textures["droppedbomb.gif"];
      const sprite = new PIXI.Sprite(tex);
      sprite.position.set(i * 14, 0);
      this.bombs.addChild(sprite);
    }

    this.bombs.position.set(296, 108);

    const tex = spritesheet.textures["metalpanel.jpg"];
    this.panel = new PIXI.Sprite(tex);
    this.container.addChild(this.panel);
    this.container.addChild(this.radar.container);
    this.container.addChild(this.infoBars);
    this.container.addChild(this.bombs);

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

  public updateFollowObject(data: any): void {
    this.infoBars.clear();
    this.infoBars.beginFill(0xffffff);
    // Draw our health
    if (data.health !== undefined) {
      this.infoBars.drawRect(290, 44, Math.round((75 * data.health) / 255), 12);
    }
    if (data.fuel !== undefined) {
      this.infoBars.drawRect(290, 65, Math.round((75 * data.fuel) / 255), 12);
    }
    if (data.ammo !== undefined) {
      this.infoBars.drawRect(290, 86, Math.round((75 * data.ammo) / 255), 12);
    }
    // highlight correct number of bombs
    const bombCount = data.bombs == undefined ? 0 : data.bombs;

    for (let i = 0; i < 5; i++) {
      const bomb = this.bombs.getChildAt(i) as PIXI.Sprite;
      if (bombCount > i) {
        bomb.texture = this.spritesheet.textures["carrybomb.gif"];
      } else {
        bomb.texture = this.spritesheet.textures["droppedbomb.gif"];
      }
    }
    this.infoBars.endFill();
  }
}
