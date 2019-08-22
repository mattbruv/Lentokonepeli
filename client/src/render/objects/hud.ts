import * as PIXI from "pixi.js";
import { spriteSheet } from "../textures";
import { SCREEN_HEIGHT, PANEL_HEIGHT } from "../constants";
import { Team } from "../../../../dogfight/src/constants";

const WOOD_PANEL = "woodpanel.jpg";
const METAL_PANEL = "metalpanel.jpg";

export class GameHUD {
  public container: PIXI.Container;

  private panel: PIXI.Sprite;
  private team: Team;

  public constructor() {
    this.container = new PIXI.Container();
    const texture: PIXI.Texture = spriteSheet.textures[METAL_PANEL];
    this.panel = new PIXI.Sprite(texture);
    this.panel.position.y = SCREEN_HEIGHT - PANEL_HEIGHT;
    this.container.addChild(this.panel);
  }

  public setTeam(team: Team): void {
    this.team = team;

    let panelTexture: string;
    switch (this.team) {
      case Team.Allies:
        panelTexture = WOOD_PANEL;
        break;
      case Team.Centrals:
        panelTexture = METAL_PANEL;
        break;
    }
    this.panel.texture = spriteSheet.textures[panelTexture];
  }
}
