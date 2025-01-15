import * as PIXI from "pixi.js";
import { Textures } from "./textures";
import { Team } from "dogfight-types/Team";


export type Stats = {
  health?: number
  fuel?: number
  ammo?: number
  bombs?: number
}

export class GameHUD {
  public container: PIXI.Container;

  private panel: PIXI.Sprite;
  private stats: PIXI.Graphics;
  private bombs: PIXI.Container;
  private previousStats: Stats

  constructor() {
    this.container = new PIXI.Container();

    this.panel = new PIXI.Sprite();
    this.stats = new PIXI.Graphics();
    this.bombs = new PIXI.Container();

    this.bombs.position.set(296, 108)


    this.previousStats = {}

    this.container.addChild(this.panel);
    this.container.addChild(this.stats);
    this.container.addChild(this.bombs);
  }

  public init() {
    this.panel.texture = Textures["metalpanel.jpg"];

    for (let i = 0; i < 5; i++) {
      const sprite = new PIXI.Sprite(Textures["droppedbomb.gif"])
      sprite.position.set(i * 14, 0)
      this.bombs.addChild(sprite)
    }
  }

  public updateStats(stats: Stats) {
    if (JSON.stringify(stats) == JSON.stringify(this.previousStats)) return
    this.previousStats = stats;

    // update bomb count
    const bombCount = stats.bombs ?? 0
    for (let i = 0; i < 5; i++) {
      const bomb = this.bombs.children[i] as PIXI.Sprite;
      const tex = (i < bombCount) ? Textures["carrybomb.gif"] : Textures["droppedbomb.gif"]
      bomb.texture = tex
    }

    this.stats.clear();
    this.stats.beginFill("white")

    // draw health bar
    const health = stats.health ?? 0;
    this.stats.drawRect(290, 44, 74 * health / 255, 12)

    // draw fuel
    const fuel = stats.fuel ?? 0;
    this.stats.drawRect(290, 65, 74 * fuel / 255, 12)

    // draw ammo
    const ammo = stats.ammo ?? 0;
    this.stats.drawRect(290, 86, 74 * ammo / 255, 12)


    //this.stats.beginFill("yellow")
    //this.stats.drawRect(0, 0, 50, 100)

    this.stats.endFill()
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
