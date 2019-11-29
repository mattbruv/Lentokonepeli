import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { EntityType } from "../../../../dogfight/src/entity";
import { Properties } from "../../../../dogfight/src/state";
import { DrawLayer } from "../constants";
import { Team } from "../../../../dogfight/src/constants";

const FLAG_STR = "flag_TEAM_N.gif";

const FLAG_PHASE_TIME = 256; // milliseconds

export class FlagSprite implements GameSprite {
  public entityId: number;
  public entityType = EntityType.Flag;
  public container: PIXI.Container;
  public debugContainer: PIXI.Container;

  private spritesheet: PIXI.Spritesheet;

  private flag: PIXI.Sprite;

  private phase: number = 1;
  private interval: number;

  private x: number;
  private y: number;
  private team: Team = Team.Centrals;

  public constructor(spritesheet: PIXI.Spritesheet, id: number) {
    this.spritesheet = spritesheet;
    this.entityId = id;

    this.container = new PIXI.Container();
    this.debugContainer = new PIXI.Container();

    const tex = this.getTextureString();
    const texture = spritesheet.textures[tex];
    this.flag = new PIXI.Sprite(texture);
    this.flag.position.y = -Math.round(texture.height / 2) - 10;

    this.container.addChild(this.flag);

    // start animation
    this.interval = window.setInterval((): void => {
      this.waveFlag();
    }, FLAG_PHASE_TIME);

    this.container.zIndex = DrawLayer.Flag;
  }

  private waveFlag(): void {
    this.phase = this.phase == 3 ? 1 : this.phase + 1;
    const tex = this.getTextureString();
    this.flag.texture = this.spritesheet.textures[tex];
  }

  private getTextureString(): string {
    const side = this.team == Team.Centrals ? "ger" : "raf";
    return FLAG_STR.replace("TEAM", side).replace("N", this.phase.toString());
  }

  public update(props: Properties): void {
    console.log("TOWER", props);

    if (props.x !== undefined) {
      this.x = props.x;
    }
    if (props.y !== undefined) {
      this.y = props.y;
    }
    if (props.team !== undefined) {
      this.team = props.team;
    }
    this.draw();
  }

  private draw(): void {
    const tex = this.getTextureString();
    this.flag.texture = this.spritesheet.textures[tex];
    // center runway on x
    const halfWidth = Math.round(this.container.width / 2);
    this.container.x = this.x - halfWidth;

    // update height
    const offset = 25; //this.direction == RunwayDirection.Right ? 25 : 25;
    this.container.position.y = -this.y - offset;
  }

  public destroy(): void {
    window.clearInterval(this.interval);
  }
}
