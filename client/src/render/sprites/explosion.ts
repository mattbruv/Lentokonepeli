import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import { Team } from "../../../../dogfight/src/constants";
import { EXPLOSION_TIME } from "../../../../dogfight/src/objects/explosion";

const FLAG_STR = "flag_TEAM_N.gif";

const FLAG_PHASE_TIME = 256; // milliseconds

export class ExplosionSprite extends GameSprite {
  public x: number;
  public y: number;

  private container: PIXI.Container;
  private spritesheet: PIXI.Spritesheet;
  private explosion: PIXI.Sprite;
  private phase: number;
  private timeout: number;
  private animating: boolean = false;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.x = 0;
    this.y = 0;

    this.spritesheet = spritesheet;
    this.phase = 1;

    const tex = this.getTextureString();
    const texture = spritesheet.textures[tex];

    this.explosion = new PIXI.Sprite(texture);
    this.explosion.anchor.set(0.5);

    this.container = new PIXI.Container();
    this.container.zIndex = DrawLayer.Explosion;

    this.container.addChild(this.explosion);
    this.renderables.push(this.container);
  }

  private nextFrame(): void {
    if (this.phase <= 8) {
      // console.log(this.getTextureString(), this.x, this.y);
      this.explosion.texture = this.spritesheet.textures[
        this.getTextureString()
      ];
      this.phase++;
    } else {
      this.explosion.visible = false;
    }
    this.timeout = window.setTimeout((): void => {
      this.nextFrame();
    }, EXPLOSION_TIME / 8);
  }

  private getTextureString(): string {
    return "explosion000" + this.phase + ".gif";
  }

  public redraw(): void {
    this.explosion.position.set(this.x, this.y);
    if (!this.animating) {
      this.animating = true;
      this.nextFrame();
    }
  }

  public destroy(): void {
    window.clearTimeout(this.timeout);
  }
}
