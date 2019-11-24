import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { EntityType } from "../../../../dogfight/src/entity";
import { Properties } from "../../../../dogfight/src/state";

export class GroundSprite implements GameSprite {
  public entityId: number;
  public entityType = EntityType.Ground;
  public container: PIXI.Container;

  public constructor(spritesheet: PIXI.Spritesheet, id: number) {
    this.entityId = id;
    console.log(spritesheet);
    this.container = new PIXI.Container();
    console.log("create ground sprite!");
  }

  public update(props: Properties): void {
    console.log("update this entity with: ", props);
  }
}
