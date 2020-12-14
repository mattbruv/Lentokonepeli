import { FacingDirection, Team, SCALE_FACTOR } from "../constants";
import { Entity, EntityType } from "../entity";
import { Cache, CacheEntry } from "../network/cache";
import { SolidEntity } from "./SolidEntity";
import { Rectangle } from "../physics/rectangle";
import { Bullet } from "./Bullet";
import { PlayerInfo } from "./PlayerInfo";
import { GameWorld } from "../world/world";


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
  private playersInside = [];


  public image;
  public imageWidth;
  public imageHeight;

  public yOffset = 7;

  public constructor(id: number, world: GameWorld, cache: Cache, team: number, x: number, y: number, direction: number) {
    super(id, world, team);
    this.image = [world.getImage("runway.gif"), world.getImage("runway2.gif")];
    this.imageWidth = [this.image[0].width, this.image[1].width];
    this.imageHeight = [this.image[0].height, this.image[1].height];
    this.setData(cache, {
      x: x,
      y: y,
      direction: direction, //FacingDirection.Right,
      team: team, //Team.Centrals,
      health: 1530
    });

    console.log(this.getCollisionBounds());

  }

  public getImageWidth(paramInt: number): number {
    return this.imageWidth[paramInt];
  }
  public getImageHeight(paramInt: number): number {
    return this.imageHeight[paramInt];
  }

  public getCollisionBounds(): Rectangle {
    return new Rectangle(this.x, this.y + this.yOffset, this.imageWidth[1 - this.direction], this.imageHeight[1 - this.direction]);
  }
  public getCollisionImage() {
    return this.image[1 - this.direction];
  }

  public getImage() {
    return this.image[1 - this.direction];
  }

  public getLandableWidth(): number {
    return (this.imageWidth[1 - this.direction] - 65);
  }

  public getLandableX(): number {
    if (this.direction == 1) {
      return 65 + this.x - this.getImageWidth(0) / 2;
    }
    return this.x - this.getImageWidth(0) / 2;
  }
  public getLandableY(): number {
    return -23 + this.y + this.getImageHeight(0) / 2 + this.yOffset;
  }
  public getStartX(): number {
    if (this.direction == 1) {
      return 15 + this.x - this.getImageWidth(0) / 2;
    }
    return this.x + 230 - this.getImageWidth(0) / 2;
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
          this.setChanged(true);
        }
      }
    }
  }

  public hit(paramSolidEntity: SolidEntity): void {
    if (this.health <= 0) {
      return;
    }
    switch (paramSolidEntity.getType()) {
      // TODO check vs src if ids correct
      case EntityType.Bomb:
        this.health -= 30;
        break;
      case EntityType.Bullet:
        let b: Bullet = paramSolidEntity as Bullet;
        this.health -= (4.0 * b.getDamageFactor());
        //console.log("bullet hit");
        break;
      case EntityType.Explosion:
        //TODO reenable plane hit damage
        this.health -= 17;
        break;
      default:
        return;
    }
    if (this.health <= 0) {
      this.health = 0;
      this.destroyed(paramSolidEntity.getTeam());
    }
    this.setChanged(true);
  }

  public planeCrash(): void {
    if (this.health <= 0) {
      return;
    }
    this.health -= 17;
    if (this.health <= 0) {
      this.health = 0;
      this.destroyed(this.getTeam());
    }
    this.setChanged(true);
  }

  /**
   * 
   * @param paramInt Team id
   */
  private destroyed(paramInt: number): void {
    let i = paramInt;
    if (i == this.getTeam()) {
      i = 1 - i;
    }
    //getDogfightToolkit().adjustScore(i, 100);
    //this.toolkit.pushText(3, "team" + getTeam() + " runway destroyed.");
    console.log("Destroyed")
    /*
    synchronized(this.playersInside)
    {
      Iterator localIterator = this.playersInside.iterator();
      while (localIterator.hasNext()) {
        PlayerInfo localPlayerInfo = (PlayerInfo)localIterator.next();
        getDogfightToolkit().killedWithoutAvatar(localPlayerInfo, 2);
        localPlayerInfo.removeAvatar();
        getDogfightToolkit().diedWithoutAvatar(localPlayerInfo, getStartX() + imageWidth[(1 - this.direction)], getStartY());
        localIterator.remove();
      }
    }
    */
  }

  public isAlive() {
    return this.health > 0;
  }

  public addPlayerInside(pi: PlayerInfo): void {
    if (!this.isAlive()) {
      console.log("Tryied to join dead runway");
    }
    else {
      this.playersInside.push(pi);
    }
  }

  public removePlayerInside(pi: PlayerInfo): void {
    const index = this.playersInside.indexOf(pi, 0);
    if (index > -1) {
      this.playersInside.splice(index, 1);
    }
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
