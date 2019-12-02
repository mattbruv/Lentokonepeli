import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { EntityType } from "../../../../dogfight/src/entity";
import { Properties } from "../../../../dogfight/src/state";
import { DrawLayer, TeamColor } from "../constants";
import { RunwayDirection, Team } from "../../../../dogfight/src/constants";
import {
  TrooperDirection,
  TrooperState
} from "../../../../dogfight/src/entities/trooper";

const HEALTH_BAR_HEIGHT = 3;

export class TrooperSprite implements GameSprite {
  public entityId: number;
  public entityType = EntityType.Trooper;
  public container: PIXI.Container;
  public debugContainer: PIXI.Container;

  private trooper: PIXI.Sprite;

  private spritesheet: PIXI.Spritesheet;

  private x: number;
  private y: number;
  private health: number = 1;
  private direction: TrooperDirection = TrooperDirection.None;
  private team: Team = Team.Centrals;
  private state: TrooperState = TrooperState.Standing;

  public constructor(spritesheet: PIXI.Spritesheet, id: number) {
    this.spritesheet = spritesheet;
    this.entityId = id;

    this.container = new PIXI.Container();
    this.debugContainer = new PIXI.Container();

    const texture = spritesheet.textures["parachuter1.gif"];
    this.trooper = new PIXI.Sprite(texture);

    this.trooper.x = -Math.round(texture.width / 2);
    this.trooper.y = -Math.round(texture.height);

    this.container.addChild(this.trooper);

    this.container.zIndex = DrawLayer.Trooper;
    this.container.sortableChildren = true;
  }

  public update(props: Properties): void {
    if (props.x !== undefined) {
      this.x = props.x;
    }
    if (props.y !== undefined) {
      this.y = -props.y;
    }
    if (props.direction !== undefined) {
      this.direction = props.direction;
    }
    if (props.health !== undefined) {
      this.health = props.health;
    }
    if (props.team !== undefined) {
      this.team = props.team;
    }
    if (props.state !== undefined) {
      this.state = props.state;
    }
    this.draw();
  }

  private draw(): void {
    this.container.position.set(this.x, this.y);
  }

  public destroy(): void {}
}
