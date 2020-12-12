import { FacingDirection, Team } from "../constants";
import { TypedEntity, EntityType } from "../TypedEntity";
import { Cache, CacheEntry } from "../network/cache";
import { SolidEntity } from "./SolidEntity";
import { spriteSheet } from "../../../client/src/render/textures";
import { Rectangle } from "../physics/rectangle";
import { SimplePlane } from "pixi.js";

const RESERVE_TAKEOFF_LANDING_DELAY = 1000;
const RESERVE_LANDING_TAKEOFF_DELAY = 2000;
const RESERVE_LANDING_LANDING_DELAY = 1000;
const RESERVE_TAKEOFF_TAKEOFF_DELAY = 1000;
const TAKEOFF = 1;
const LANDING = 1;
const HEALTH_MAX = 1530;
const HEALTH_TIMER_MAX = 50;

export class Runway extends SolidEntity {
  public type = EntityType.Runway;

  public x: number;
  public y: number;
  public direction: FacingDirection;
  public team: Team;
  public health: number;

  public lastReserve: number;
  public reserveTimer: number;
  public healthTimer: number;


  public image = [spriteSheet.textures["runway.gif"], spriteSheet.textures["runway2.gif"]];
  public imageWidth = [this.image[0].width, this.image[1].width];
  public imageHeight = [this.image[0].height, this.image[1].height];

  public constructor(id: number, cache: Cache, team: number, x: number, y: number, direction: number) {
    super(id, team);
    this.setData(cache, {
      x: x,
      y: y,
      direction: direction, //FacingDirection.Right,
      team: team, //Team.Centrals,
      health: 1530
    });
  }

  public getImageWidth(paramInt: number): number {
    return this.imageWidth[paramInt];
  }

  public getCollisionBounds(): Rectangle {
    return new Rectangle(this.x, this.y, this.imageWidth[1 - this.direction], this.imageHeight[1 - this.direction]);
  }

  public getImage() {
    return this.image[1 - this.direction];
  }

  public getLandableWidth(): number {
    return this.imageWidth[1 - this.direction] - 65;
  }

  public getLandableX(): number {
    if (this.direction == 1) {
      return 65 + this.x;
    }
    return this.x;
  }
  public getLandableY(): number {
    return 23 + this.y;
  }
  public getStartX(): number {
    if (this.direction == 1) {
      return 15 + this.x;
    }
    return this.x + 230;
  }
  public getStartY(): number {
    return this.getLandableY();
  }
  public getDirection(): number {
    return this.direction;
  }

  /**
   * TODO synchronized?!?!?
   * @param paramInt LANDING or TAKEOFF request
   */
  public reserveFor(paramInt: number): boolean {
    let l1 = Date.now();
    let l2 = 0;
    switch (paramInt) {
      case 2:
        if (this.lastReserve == 2) {
          l2 = 1000;
        } else {
          l2 = 1000;
        }
        break;
      case 1:
        if (this.lastReserve == 2) {
          l2 = 2000;
        } else {
          l2 = 1000;
        }
        break;
    }
    if (this.reserveTimer + l2 > l1) {
      return false;
    }
    if (this.health <= 0) {
      return false;
    }
    this.reserveTimer = l1;
    this.lastReserve = paramInt;
    return true;
  }

  public run(): void {
    if ((this.health > 0) && (this.health < 1530)) {
      this.healthTimer = ((this.healthTimer + 1) % 50);
      if (this.healthTimer == 0) {
        this.health += 1;
        if (this.health * 255 % 1530 == 0) {
          //setChanged(true);
        }
      }
    }
  }

  public hit(paramSolidEntity: SolidEntity): void {
    if (this.health <= 0) {
      return;
    }
    switch (paramSolidEntity.getType()) {
      case 17:
        this.health -= 30;
        break;
      case EntityType.Bullet:
        this.health -= (int)(4.0D * ((Bullet)paramSolidEntity).getDamageFactor());
        break;
      case 27:
        this.health -= 17;
        break;
      default:
        return;
    }
    if (this.health <= 0) {
      this.health = 0;
      this.destroyed(paramSolidEntity.getTeam());
    }
    setChanged(true);
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      direction: this.direction,
      team: this.team,
      health: this.health
    };
  }
}
