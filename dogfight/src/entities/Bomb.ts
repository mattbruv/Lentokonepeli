import { Entity, EntityType } from "../entity";
import { Cache, CacheEntry } from "../network/cache";
import { Team, SCALE_FACTOR } from "../constants";
import { radiansToDirection, directionToRadians } from "../physics/helpers";
import { RectangleBody, Rectangle } from "../physics/rectangle";
import { GameWorld, } from "../world/world";
import { PlayerInfo } from "./PlayerInfo";
import { SolidEntity } from "./SolidEntity";
import { Ownable } from "../ownable";
import { BufferedImage } from "../BufferedImage";
import { Runway } from "./Runway";
import { Plane } from "./Plane";
import { OwnableSolidEntity } from "./OwnableSolidEntity";

export const bombGlobals = {
  gravity: 425,
  drag: 0.005,
  cooldown: 500
};

export class Bomb extends OwnableSolidEntity {

  public type = EntityType.Bomb;
  public age: number;
  public localX: number;
  public localY: number;
  public x: number;
  public y: number;
  public droppedBy: number; // ID of player who dropped it
  public team: Team; // team of player who dropped it

  public image;
  public width;
  public height;

  public xSpeed: number;
  public ySpeed: number;
  public radians: number;
  public origin: OwnableSolidEntity;
  public filename = "bomb.gif";
  //public direction: number;

  public constructor(id: number, world: GameWorld, cache: Cache, x: number, y: number, direction: number, speed: number, origin: OwnableSolidEntity) {
    super(id, world, origin.getTeam());
    //this.radians = directionToRadians(direction);
    this.setDirection(cache, direction);
    this.setPos(cache, x, y);
    //this.localX = x * SCALE_FACTOR;
    //this.localY = y * SCALE_FACTOR;
    this.setSpeed(cache, speed * SCALE_FACTOR); // needs radians to be set
    this.image = world.getImage(this.filename);
    this.width = this.image.width;
    this.height = this.image.height;
    this.origin = origin;


    this.setData(cache, {
      age: 0,
      x: x,
      y: y,
      direction: direction,
      droppedBy: origin.getPlayerInfo().id,
      team: origin.getTeam()
    });
  }
  public getPlayerInfo(): PlayerInfo {
    return this.origin.getPlayerInfo();
    //throw new Error("Method not implemented.");
  }
  public getRootOwner(): Ownable {
    return this.origin.getRootOwner();
    //throw new Error("Method not implemented.");
  }
  public getCollisionBounds(): import("../physics/rectangle").Rectangle {
    //throw new Error("Method not implemented.");
    return new Rectangle(this.x, this.y, this.width, this.height);
  }
  public getCollisionImage(): BufferedImage {
    return this.world.getImage(this.filename + "_rot_" + radiansToDirection(this.radians) + "_flip_" + false);
  }
  public tick(cache: Cache, deltaTime: number): void {
    this.move(cache, deltaTime);
    this.ageBomb(cache, deltaTime);
    this.checkCollision();
  }

  private ageBomb(cache: Cache, deltaTime: number): void {
    this.age += deltaTime;
  }

  public hit(se: SolidEntity): void {
    console.log("bomb - hit");
    if (se == null) {
      this.getPlayerInfo().submitBomb(this, false, false);
      this.world.removeEntity(this);
    }
    else if (this.origin == null || !(this.origin === se)) { //&& !this.isRemoved()) 
      if (se.getType() == EntityType.ControlTower || se.getType() == EntityType.Runway) {
        if (se.getTeam() == this.getTeam()) {
          this.getPlayerInfo().submitTeamBomb(this, true);
        }
        else {
          this.getPlayerInfo().submitBomb(this, true, true);
        }
      }
      else if (se instanceof Plane) {
        if (se.getTeam() == this.getTeam()) {
          this.getPlayerInfo().submitTeamBomb(this, false);
        }
        else {
          this.getPlayerInfo().submitBomb(this, true, false);
        }
      }
      else {
        this.getPlayerInfo().submitBomb(this, false, false);
      }
      this.world.removeEntity(this);
      if (se.getType() != EntityType.Water) {
        this.world.createExplosion(this.x, this.y, this);
      }
    }

  }

  public move(cache: Cache, deltaTime: number): void {
    // move the bomb...
    //console.log(this.x, this.y, this.xSpeed);
    const tstep = deltaTime / 1000;
    const xDelta = tstep * 1; // 0.01 * 100 tps in original
    const yDelta = tstep * 1000 / 3; // 3.33 * 100 tps in original

    this.localX += this.xSpeed * tstep * SCALE_FACTOR;
    this.localY += this.ySpeed * tstep * SCALE_FACTOR;
    this.xSpeed -= this.xSpeed * xDelta;
    this.ySpeed -= yDelta;
    this.radians = Math.atan2(this.ySpeed, this.xSpeed);

    this.setData(cache, {
      x: Math.round(this.localX / SCALE_FACTOR),
      y: Math.round(this.localY / SCALE_FACTOR),
      direction: radiansToDirection(this.radians)
    });
  }

  public setSpeed(cache: Cache, scaledSpeed: number): void {
    this.xSpeed =
      Math.cos(this.radians) * Math.round(scaledSpeed);
    this.ySpeed =
      Math.sin(this.radians) * Math.round(scaledSpeed);
  }

  public setDirection(cache: Cache, dir: number): void {
    this.radians = directionToRadians(dir);
    this.set(cache, "direction", dir);
  }

  public setPos(cache: Cache, x: number, y: number): void {
    // console.log(x, y);
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    // console.log(this.localX / 100, this.localY / 100);
    this.setData(cache, { x, y });
    // console.log(this.x, this.y);
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      age: this.age,
      x: this.x,
      y: this.y,
      direction: radiansToDirection(this.radians)
    };
  }
}

export function getBombRect(
  x: number,
  y: number,
  direction: number,
): RectangleBody {
  return {
    // width: Math.round(planeData[type].width * 0.8),
    // height: Math.round(planeData[type].height * 0.8),
    // TODO get from image
    width: 7,
    height: 10,
    center: { x, y },
    direction,
  };
}