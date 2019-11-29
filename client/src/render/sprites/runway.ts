import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { EntityType } from "../../../../dogfight/src/entity";
import { Properties } from "../../../../dogfight/src/state";
import { DrawLayer, TeamColor } from "../constants";
import { RunwayDirection, Team } from "../../../../dogfight/src/constants";

const HEALTH_BAR_HEIGHT = 3;

export class RunwaySprite implements GameSprite {
  public entityId: number;
  public entityType = EntityType.Runway;
  public container: PIXI.Container;
  public debugContainer: PIXI.Container;

  private runway: PIXI.Sprite;
  private backpart: PIXI.Sprite;
  private healthBar: PIXI.Graphics;

  private spritesheet: PIXI.Spritesheet;
  private runwayWidth: number;

  private x: number;
  private y: number;
  private health: number = 100;
  private direction: RunwayDirection = RunwayDirection.Right;
  private team: Team;

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

    // create health bar
    this.healthBar = new PIXI.Graphics();
    this.healthBar.position.x = 10;
    this.healthBar.position.y = texture.height - 4;
    this.runwayWidth = texture.width;

    this.container.addChild(this.runway);
    this.container.addChild(this.backpart);
    this.container.addChild(this.healthBar);

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
    if (props.health !== undefined) {
      this.health = props.health;
    }
    if (props.team !== undefined) {
      this.team = props.team;
    }
    this.draw();
  }

  private draw(): void {
    // set direction and appropriate texture
    if (this.direction == RunwayDirection.Right) {
      const tex = this.health > 0 ? "runway.gif" : "runway_broke.gif";
      this.runway.texture = this.spritesheet.textures[tex];
      this.backpart.visible = false;
    } else {
      const tex = this.health > 0 ? "runway2.gif" : "runway2_broke.gif";
      this.runway.texture = this.spritesheet.textures[tex];
      this.backpart.visible = this.health > 0;
    }

    // center runway on x
    const halfWidth = Math.round(this.container.width / 2);
    this.container.x = this.x - halfWidth;

    // update height
    const offset = 25; //this.direction == RunwayDirection.Right ? 25 : 25;
    this.container.position.y = -this.y - offset;

    // draw health bars
    this.drawHealthBar();
  }

  private drawHealthBar(): void {
    const color =
      this.team == Team.Allies
        ? TeamColor.OpponentBackground
        : TeamColor.OwnBackground;
    console.log(color);

    const amount = Math.round((this.runwayWidth - 20) * (this.health / 255));

    this.healthBar.clear();
    this.healthBar.beginFill(color);
    this.healthBar.drawRect(0, 0, amount, HEALTH_BAR_HEIGHT);
    this.healthBar.endFill();

    /*
    paramGraphics2D.fillRect
        (paramInt1 + 10,
         paramInt2 + image[0].getHeight() - 3 - 1,
         (image[0].getWidth() - 20) * this.health / 255,
         3);
    */
  }

  public destroy(): void {}
}
