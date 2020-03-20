import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import { Team } from "../../../../dogfight/src/constants";

const FLAG_STR = "flag_TEAM_N.gif";

const FLAG_PHASE_TIME = 256; // milliseconds

export class FlagSprite extends GameSprite {
  public x: number;
  public y: number;
  public team: number;

  private container: PIXI.Container;
  private spritesheet: PIXI.Spritesheet;
  private flag: PIXI.Sprite;
  private phase: number;
  private interval: number;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.x = 0;
    this.y = 0;
    this.team = Team.Centrals;

    this.spritesheet = spritesheet;
    this.phase = 1;

    const tex = this.getTextureString();
    const texture = spritesheet.textures[tex];

    this.container = new PIXI.Container();
    this.container.zIndex = DrawLayer.Flag;

    this.flag = new PIXI.Sprite(texture);
    this.flag.position.y = -Math.round(texture.height / 2) - 10;

    // start animation
    this.interval = window.setInterval((): void => {
      this.waveFlag();
    }, FLAG_PHASE_TIME);

    this.container.addChild(this.flag);
    this.renderables.push(this.container);
  }

  private waveFlag(): void {
    this.phase = this.phase == 3 ? 1 : this.phase + 1;
    const tex = this.getTextureString();
    this.flag.texture = this.spritesheet.textures[tex];
  }

  private getTextureString(): string {
    const side = this.team == Team.Centrals ? "ger" : "raf";
    return FLAG_STR.replace("TEAM", side).replace("N", this.phase.toString());
  }

  public redraw(): void {
    const tex = this.getTextureString();
    this.flag.texture = this.spritesheet.textures[tex];

    // center on x
    const halfWidth = Math.round(this.container.width / 2);
    this.container.x = this.x - halfWidth;

    // update height
    const offset = 25;
    this.container.position.y = -this.y - offset;
  }

  public destroy(): void {
    window.clearInterval(this.interval);
  }
}
