import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { DrawLayer } from "../constants";
import { Terrain, FacingDirection } from "../../../../dogfight/src/constants";
import { TowerProperties } from "../../../../dogfight/src/objects/tower";

export class TowerSprite extends GameSprite implements TowerProperties {
  public x: number;
  public y: number;
  public terrain: Terrain;
  public direction: FacingDirection;

  private spritesheet: PIXI.Spritesheet;

  private container: PIXI.Container;

  private tower: PIXI.Sprite;

  private towerWidth: number;

  public constructor(spritesheet: PIXI.Spritesheet) {
    super();

    this.x = 0;
    this.y = 0;
    this.terrain = Terrain.Normal;
    this.direction = FacingDirection.Right;

    this.spritesheet = spritesheet;

    this.container = new PIXI.Container();

    const tex: PIXI.Texture = spritesheet.textures["controlTower.gif"];
    this.tower = new PIXI.Sprite(tex);
    this.tower.position.y = -tex.height;
    this.towerWidth = tex.width;

    this.container.addChild(this.tower);
    this.container.zIndex = DrawLayer.ControlTower;

    this.renderables.push(this.container);
  }

  public redraw(): void {
    // orient properly
    if (this.direction == FacingDirection.Left) {
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
