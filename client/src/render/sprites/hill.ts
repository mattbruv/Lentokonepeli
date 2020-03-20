import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer, GameScreen } from "../constants";
import { Terrain } from "../../../../dogfight/src/constants";

export class HillSprite extends GameSprite {
  public x: number;
  public y: number;
  public terrain: Terrain;

  private spritesheet: PIXI.Spritesheet;

  private container: PIXI.Container;

  private parent: PIXI.Container;

  private hill: PIXI.Sprite;

  private maxY: number;

  public constructor(spritesheet: PIXI.Spritesheet, parent: PIXI.Container) {
    super();

    this.x = 0;
    this.y = 0;
    this.terrain = Terrain.Normal;

    this.spritesheet = spritesheet;
    this.parent = parent;

    this.container = new PIXI.Container();

    const tex: PIXI.Texture = spritesheet.textures["hill1.gif"];
    this.hill = new PIXI.Sprite(tex);
    this.hill.position.x = -this.hill.width / 2;
    this.hill.position.y = -this.hill.height / 2;
    this.maxY = tex.height / 2 - 5;

    this.container.addChild(this.hill);
    this.container.zIndex = DrawLayer.Hill;

    this.renderables.push(this.container);
  }

  public redraw(): void {
    // update terrain
    const tex = this.terrain == Terrain.Normal ? "hill1.gif" : "sandhill.gif";
    this.hill.texture = this.spritesheet.textures[tex];
    this.setCamera();
  }

  public setCamera(): void {
    const centerX = Math.round(GameScreen.Width / 2);
    const centerY = Math.round(GameScreen.Height / 2);

    const center = this.parent.toLocal(new PIXI.Point(centerX, centerY));
    //center.x *= -1;
    //center.y *= -1;
    const diffX = this.x - center.x;
    const diffY = this.y - center.y;

    const newX = Math.round(this.x - diffX / 8);
    let newY = Math.round(this.y - diffY / 9);

    const min = -Math.round(this.maxY / 2);

    if (newY > this.maxY) {
      newY = this.maxY;
    }
    if (newY < min) {
      newY = min;
    }
    this.container.position.set(newX, newY);
  }

  public destroy(): void {
    //
  }
}
