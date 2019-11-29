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

  private x: number;
  private y: number;
  private direction: RunwayDirection = RunwayDirection.Right;

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

  public update(props: Properties): void {
    if (props.x !== undefined) {
      this.x = props.x;
    }
    if (props.y !== undefined) {
      this.y = props.y;
    }
    if (props.direction !== undefined) {
      this.direction = props.direction;
    }
    this.draw();
  }

  private draw(): void {
    // set direction
    if (this.direction == RunwayDirection.Right) {
      this.runway.texture = this.spritesheet.textures["runway.gif"];
      this.backpart.visible = false;
    } else {
      this.runway.texture = this.spritesheet.textures["runway2.gif"];
      this.backpart.visible = true;
    }

    // center runway on x
    const halfWidth = Math.round(this.container.width / 2);
    this.container.x = this.x - halfWidth;

    // update height
    const offset = 25; //this.direction == RunwayDirection.Right ? 25 : 25;
    this.container.position.y = -this.y - offset;
  }

  public destroy(): void {}
}
