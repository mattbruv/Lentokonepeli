import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import { EntityType } from "../../../../dogfight/src/entity";

export class PlayerSprite extends GameSprite {
  public name: string;
  public controlID: number;
  public controlType: EntityType;

  private spritesheet: PIXI.Spritesheet;

  private container: PIXI.Container;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();
    this.container.zIndex = DrawLayer.Player;
  }

  public redraw(): void {
    //
  }

  public destroy(): void {
    //
  }
}
