import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { EntityType } from "../../../../dogfight/src/entity";
import { Properties } from "../../../../dogfight/src/state";
import { DrawLayer } from "../constants";
import { RunwayDirection } from "../../../../dogfight/src/constants";

export class RunwaySprite implements GameSprite {
  public entityId: number;
  public entityType = EntityType.Runway;
  public container: PIXI.Container;
  public debugContainer: PIXI.Container;

  private runway: PIXI.Sprite;
  private backpart: PIXI.Sprite;

  private spritesheet: PIXI.Spritesheet;

  private direction: RunwayDirection = RunwayDirection.Right;
  private y: number = 0;

  public constructor(spritesheet: PIXI.Spritesheet, id: number) {
    this.spritesheet = spritesheet;
    this.entityId = id;

    this.container = new PIXI.Container();
    this.debugContainer = new PIXI.Container();

    const texture = spritesheet.textures["runway.gif"];
    this.runway = new PIXI.Sprite(texture);
    const backTex = spritesheet.textures["runway2b.gif"];
    this.backpart = new PIXI.Sprite(backTex);
    this.backpart.x = 214;
    this.backpart.visible = false;

    this.container.addChild(this.runway);
    this.container.addChild(this.backpart);

    this.container.zIndex = DrawLayer.Runway;
    this.container.sortableChildren = true;
    this.runway.zIndex = DrawLayer.Runway;
    this.backpart.zIndex = DrawLayer.RunwayBack;
  }

  private redraw(): void {
    this.redrawHeight();
  }

  private redrawHeight(): void {
    const offset = this.direction == RunwayDirection.Right ? 25 : 25;
    this.container.position.y = -this.y - offset;
  }

  private setDirection(dir: RunwayDirection): void {
    this.direction = dir;
    if (dir == RunwayDirection.Right) {
      this.runway.texture = this.spritesheet.textures["runway.gif"];
      this.backpart.visible = false;
    } else {
      this.runway.texture = this.spritesheet.textures["runway2.gif"];
      this.backpart.visible = true;
    }
  }

  private center(newX: number): void {
    const halfWidth = Math.round(this.container.width / 2);
    this.container.x = newX - halfWidth;
  }

  public update(props: Properties): void {
    console.log("update this entity with: ", props);
    if (props.width !== undefined) {
    }
    if (props.x !== undefined) {
      this.center(props.x);
    }
    if (props.y !== undefined) {
      this.y = props.y;
    }
    if (props.direction !== undefined) {
      this.setDirection(props.direction);
    }
    this.redraw();
  }

  public destroy(): void {}
}
