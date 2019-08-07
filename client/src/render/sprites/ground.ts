import * as PIXI from "pixi.js";
import { GameSprite } from "./gameSprite";
import { Ground } from "../../../../dogfight/src/entities/ground";
import { spriteSheet } from "../textures";

export class GroundSprite implements GameSprite<Ground> {
  private container: PIXI.Container;

  private groundContainer: PIXI.Container;

  private groundLeft: PIXI.Sprite;
  private groundMid: PIXI.Sprite;
  private groundRight: PIXI.Sprite;

  public constructor(world: PIXI.Container) {
    this.container = world;
    this.groundContainer = new PIXI.Container();
    // Initialize sprites
    this.groundLeft = new PIXI.Sprite(spriteSheet.textures["src/beach-l.gif"]);
    this.groundMid = new PIXI.Sprite(spriteSheet.textures["src/ground1.gif"]);
    this.groundRight = new PIXI.Sprite(spriteSheet.textures["src/beach-l.gif"]);

    // Set sprite anchors
    this.groundMid.anchor.set(0.5);
  }

  public addSprite(data: Ground): void {
    this.groundContainer.addChild(this.groundLeft);
    this.groundContainer.addChild(this.groundMid);
    this.groundContainer.addChild(this.groundRight);
    this.container.addChild(this.groundContainer);
    console.log("create" + data);
  }

  public updateSprite(data: Ground): void {}

  public deleteSprite(): void {
    console.log("remove self");
  }
}
