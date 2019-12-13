import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { RunwayProperties } from "../../../../dogfight/src/objects/runway";
import { FacingDirection, Team } from "../../../../dogfight/src/constants";
import { DrawLayer, TeamColor } from "../constants";

const HEALTH_BAR_HEIGHT = 3;

export class RunwaySprite extends GameSprite implements RunwayProperties {
  public x: number;
  public y: number;
  public direction: FacingDirection;
  public team: Team;
  public health: number;

  private spritesheet: PIXI.Spritesheet;

  private runway: PIXI.Sprite;
  private backpart: PIXI.Sprite;
  private healthBar: PIXI.Graphics;

  private runwayWidth: number;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.x = 0;
    this.y = 0;
    this.direction = FacingDirection.Right;
    this.team = Team.Centrals;
    this.health = 255;

    this.spritesheet = spritesheet;

    const texture = spritesheet.textures["runway.gif"];
    const backTex = spritesheet.textures["runway2b.gif"];

    this.runwayWidth = texture.width;

    this.runway = new PIXI.Sprite(texture);

    this.backpart = new PIXI.Sprite(backTex);
    //this.backpart.x = 217;
    this.backpart.visible = false;

    this.healthBar = new PIXI.Graphics();
    this.healthBar.position.x = 10;
    this.healthBar.position.y = texture.height - 4;

    this.runway.zIndex = DrawLayer.Runway;
    this.healthBar.zIndex = DrawLayer.Runway;
    this.backpart.zIndex = DrawLayer.RunwayBack;

    this.renderables.push(this.runway);
    this.renderables.push(this.backpart);
    this.renderables.push(this.healthBar);
  }

  public redraw(): void {
    // set direction and appropriate texture
    if (this.direction == FacingDirection.Right) {
      const tex = this.health > 0 ? "runway.gif" : "runway_broke.gif";
      this.runway.texture = this.spritesheet.textures[tex];
      this.backpart.visible = false;
    } else {
      const tex = this.health > 0 ? "runway2.gif" : "runway2_broke.gif";
      this.runway.texture = this.spritesheet.textures[tex];
      this.backpart.visible = this.health > 0;
    }

    // center runway on x
    const halfWidth = Math.round(this.runway.width / 2);
    this.runway.x = this.x - halfWidth;

    // back part
    this.backpart.position.x = this.x + 76;
    this.backpart.position.y = this.y - 25;

    // update height
    const offset = 25; //this.direction == RunwayDirection.Right ? 25 : 25;
    this.runway.position.y = this.y - offset;

    // draw health bars
    this.drawHealthBar();
  }

  private drawHealthBar(): void {
    if (this.health <= 0) {
      this.healthBar.visible = false;
      return;
    }
    this.healthBar.visible = true;

    this.healthBar.position.y = this.y + 7;
    this.healthBar.position.x = this.x - Math.round(this.runwayWidth / 2) + 10;

    // ¯\_(ツ)_/¯
    if (this.direction == FacingDirection.Left) {
      this.healthBar.position.x += 4;
    }

    const color =
      this.team == Team.Allies
        ? TeamColor.OpponentBackground
        : TeamColor.OwnBackground;

    const amount = Math.round((this.runwayWidth - 20) * (this.health / 255));

    this.healthBar.clear();
    this.healthBar.beginFill(color);
    this.healthBar.drawRect(0, 0, amount, HEALTH_BAR_HEIGHT);
    this.healthBar.endFill();
  }

  public destroy(): void {}
}
