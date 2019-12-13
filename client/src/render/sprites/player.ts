import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import { PlayerProperties } from "../../../../dogfight/src/objects/player";
import { GameObjectType } from "../../../../dogfight/src/object";

export class PlayerSprite extends GameSprite implements PlayerProperties {
  public name: string;
  public controlID: number;
  public controlType: GameObjectType;

  private spritesheet: PIXI.Spritesheet;

  private container: PIXI.Container;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();
    this.container.zIndex = DrawLayer.Player;
  }

  public redraw(): void {}

  public destroy(): void {}
}
