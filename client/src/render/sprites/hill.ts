import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { EntityType } from "../../../../dogfight/src/entity";
import { Properties } from "../../../../dogfight/src/state";
import { DrawLayer, GameScreen } from "../constants";
import { Terrain } from "../../../../dogfight/src/constants";
import { Vec2d } from "../../../../dogfight/src/physics/vector";

export class HillSprite implements GameSprite {
  public entityId: number;
  public entityType = EntityType.Hill;
  public container: PIXI.Container;
  public debugContainer: PIXI.Container;

  private hill: PIXI.Sprite;

  private x: number = 0;
  private y: number = 0;
  private terrain: Terrain;

  private spritesheet: PIXI.Spritesheet;

  private maxY: number;

  private parent: PIXI.Container;

  public constructor(
    parent: PIXI.Container,
    spritesheet: PIXI.Spritesheet,
    id: number
  ) {
    this.entityId = id;
    this.spritesheet = spritesheet;
    this.parent = parent;

    this.container = new PIXI.Container();
    this.debugContainer = new PIXI.Container();

    const tex: PIXI.Texture = spritesheet.textures["hill1.gif"];
    this.hill = new PIXI.Sprite(tex);
    this.hill.position.x = -this.hill.width / 2;
    this.hill.position.y = -this.hill.height / 2;
    this.maxY = tex.height / 2 - 5;

    this.container.addChild(this.hill);
    this.container.zIndex = DrawLayer.Hill;

    this.draw();
  }

  public update(props: Properties): void {
    if (props.x !== undefined) {
      this.x = props.x;
    }
    if (props.y !== undefined) {
      this.y = props.y;
    }
    if (props.terrain !== undefined) {
      this.terrain = props.terrain;
    }
    this.draw();
  }

  private draw(): void {
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

    const diff: Vec2d = {
      x: this.x - center.x,
      y: this.y - center.y
    };

    /*
      100 * 8 = 800 / 10 = 80
      paramInt1 = paramInt1 * 8 / 10;
      paramInt2 = paramInt2 * 9 / 10;
    */

    const newX = Math.round(this.x - diff.x / 8);
    let newY = Math.round(this.y - diff.y / 9);

    const min = -Math.round(this.maxY / 2);

    if (newY > this.maxY) {
      newY = this.maxY;
    }
    if (newY < min) {
      newY = min;
    }
    this.container.position.set(newX, newY);
  }

  public destroy(): void {}
}
