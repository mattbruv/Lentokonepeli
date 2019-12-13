import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import {
  TrooperProperties,
  TrooperState,
  TrooperDirection
} from "../../../../dogfight/src/objects/trooper";
import { Team } from "../../../../dogfight/src/constants";

export class TrooperSprite extends GameSprite implements TrooperProperties {
  public x: number;
  public y: number;
  public health: number;
  public state: TrooperState;
  public direction: TrooperDirection;
  public team: Team;

  private container: PIXI.Container;
  private spritesheet: PIXI.Spritesheet;

  private trooper: PIXI.Sprite;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.x = 0;
    this.y = 0;
    this.health = 1;
    this.direction = TrooperDirection.None;
    this.team = Team.Centrals;
    this.state = TrooperState.Standing;

    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();

    const texture = spritesheet.textures[this.getTexture()];
    this.trooper = new PIXI.Sprite(texture);
    this.trooper.x = -Math.round(texture.width / 2);
    this.trooper.y = -Math.round(texture.height);

    this.container.addChild(this.trooper);
    this.container.zIndex = DrawLayer.Trooper;

    this.renderables.push(this.container);
  }

  private getTexture(): string {
    if (this.state == TrooperState.Parachuting) {
      return "parachuter1.gif";
    }
    if (this.state == TrooperState.Walking) {
      return "parachuter2.gif";
    }
    return "parachuter0.gif";
  }

  public redraw(): void {
    // update texture state
    this.trooper.texture = this.spritesheet.textures[this.getTexture()];

    this.container.position.set(this.x, this.y);
  }

  public destroy(): void {}
}
