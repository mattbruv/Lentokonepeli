import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { EntityType } from "../../../../dogfight/src/entity";
import { Properties } from "../../../../dogfight/src/state";
import { DrawLayer } from "../constants";
import {
  Terrain,
  ControlTowerDirection
} from "../../../../dogfight/src/constants";

export class ControlTowerSprite implements GameSprite {
  public entityId: number;
  public entityType = EntityType.ControlTower;
  public container: PIXI.Container;
  public debugContainer: PIXI.Container;

  private tower: PIXI.Sprite;

  private x: number = 0;
  private y: number = 0;
  private terrain: Terrain;
  private direction: ControlTowerDirection;

  private towerWidth: number = 0;

  private spritesheet: PIXI.Spritesheet;

  public constructor(spritesheet: PIXI.Spritesheet, id: number) {
    this.entityId = id;
    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();
    this.debugContainer = new PIXI.Container();

    const tex: PIXI.Texture = spritesheet.textures["controlTower.gif"];
    this.tower = new PIXI.Sprite(tex);
    this.tower.position.y = -tex.height;
    this.towerWidth = tex.width;

    this.container.addChild(this.tower);

    this.container.zIndex = DrawLayer.ControlTower;

    this.draw();
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
    if (props.terrain !== undefined) {
      this.terrain = props.terrain;
    }
    this.draw();
  }

  private draw(): void {
    // orient properly
    if (this.direction == ControlTowerDirection.Left) {
      this.tower.scale.x = -1;
      this.tower.position.x = this.towerWidth;
    } else {
      this.tower.scale.x = 1;
      this.tower.position.x = 0;
    }
    // update terrain
    const tex =
      this.terrain == Terrain.Normal
        ? "controlTower.gif"
        : "controlTowerDesert.gif";

    this.tower.texture = this.spritesheet.textures[tex];

    // center tower
    const halfWidth = Math.round(this.container.width / 2);
    this.container.x = this.x - halfWidth;

    // update height
    const offset = 5;
    this.container.position.y = -this.y + offset;
  }

  public destroy(): void {}
}
