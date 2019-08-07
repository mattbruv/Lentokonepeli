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
    this.groundLeft = new PIXI.Sprite(spriteSheet.textures["src/beach-l.gif"]);
    this.groundMid = new PIXI.Sprite(spriteSheet.textures["src/ground1.gif"]);
    this.groundRight = new PIXI.Sprite(spriteSheet.textures["src/beach-l.gif"]);
  }

  public addSprite(data: Ground): void {
    console.log("create" + data);
  }

  public updateSprite(data: Ground): void {
    console.log("update" + data);
  }

  public deleteSprite(): void {
    console.log("remove self");
  }
}
