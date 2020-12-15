import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import { explosionGlobals } from "../../../../dogfight/src/entities/Explosion";

const ANIMATION_DURATION = 500;

export class ExplosionSprite extends GameSprite {
  public x: number;
  public y: number;

  private container: PIXI.Container;
  private spritesheet: PIXI.Spritesheet;
  private explosion: PIXI.Sprite;
  private phase: number;
  private timeout: number;
  private animating: boolean = false;
  private debug: PIXI.Graphics;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.x = 0;
    this.y = 0;

    this.spritesheet = spritesheet;
    this.phase = 1;

    const tex = this.getTextureString();
    const texture = spritesheet.textures[tex];

    this.debug = new PIXI.Graphics();
    this.debug.zIndex = DrawLayer.Explosion;

    this.explosion = new PIXI.Sprite(texture);
    this.explosion.anchor.set(0.5);

    this.container = new PIXI.Container();
    this.container.zIndex = DrawLayer.Explosion;

    this.container.addChild(this.explosion);
    this.renderables.push(this.container);
    this.renderablesDebug.push(this.debug);
  }

  private drawDebug(): void {
    this.debug.clear();
    this.debug.lineStyle(1);
    this.debug.beginFill(0xffa500, 0.5);
    this.debug.drawCircle(this.x, this.y, explosionGlobals.radius);
    this.debug.endFill();
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
    }, ANIMATION_DURATION / 8);
  }

  private getTextureString(): string {
    return "explosion000" + this.phase + ".gif";
  }

  public redraw(): void {
    this.explosion.position.set(this.x, this.y);
    this.drawDebug();
    if (!this.animating) {
      this.animating = true;
      this.nextFrame();
    }
  }

  public destroy(): void {
    window.clearTimeout(this.timeout);
  }
}
