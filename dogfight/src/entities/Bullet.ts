import { Entity, EntityType } from "../entity";
import { Cache, CacheEntry } from "../network/cache";
import { Team, SCALE_FACTOR } from "../constants";
import { Vec2d } from "../physics/vector";
import { SolidEntity } from "./SolidEntity";
import { Rectangle } from "../physics/rectangle";
import { Ownable } from "../ownable";
import { GameWorld } from "../world/world";
import { Plane } from "./Plane";
import { Man } from "./Man";
import { Runway } from "./Runway";
import { OwnableSolidEntity } from "./OwnableSolidEntity";

export const bulletGlobals = {
  speed: 400,
  damage: 25,
  lifetime: 2000 // milliseconds
};

export function moveBullet(
  localX: number,
  localY: number,
  vx: number,
  vy: number,
  deltaTime: number
): Vec2d {
  // move the bullet...
  const tstep = deltaTime / 1000;
  return {
    x: localX + tstep * vx,
    y: localY + tstep * vy
  };
}

export class Bullet extends OwnableSolidEntity {
  public type = EntityType.Bullet;
  public age: number;
  public localX: number;
  public localY: number;
  public x: number;
  public y: number;
  public width: number = 2;
  public height: number = 2;
  public origin: OwnableSolidEntity; // ID of player who shot it
  public shotBy: number; // ID of player who shot it
  public team: Team; // team of player who shot it
  public vx: number;
  public vy: number;
  public clientVX: number;
  public clientVY: number;

  public constructor(id: number, world: GameWorld, cache: Cache, origin: OwnableSolidEntity, team: Team) {
    super(id, world, team);
    this.localX = 0;
    this.localY = 0;
    this.vx = 0;
    this.vy = 0;
    this.clientVX = 0;
    this.clientVY = 0;
    this.origin = origin;
    this.setData(cache, {
      age: -1000000,
      shotBy: origin.getPlayerInfo().getId(),
      team
    });
  }
  getPlayerInfo(): import("./PlayerInfo").PlayerInfo {
    return this.origin.getPlayerInfo();
  }
  getRootOwner(): OwnableSolidEntity {
    return this.origin.getRootOwner();
  }

  public getCollisionBounds(): Rectangle {
    return new Rectangle(this.x, this.y, this.width, this.height);
  }

  public tick(cache: Cache, deltaTime: number): void {
    this.move(cache, deltaTime);
    this.ageBullet(cache, deltaTime);
  }

  public getDamageFactor(): number {
    if (this.age > 175 * 10) {
      return 0.0;
    }
    let d = this.age / 175.0 * 10;
    d *= d;
    return 1.0 - d;
  }

  private ageBullet(cache: Cache, deltaTime: number): void {
    this.age += deltaTime;
    if (this.age >= 175 * 10) {
      this.hit(null);
    }
  }

  public move(cache: Cache, deltaTime: number): void {
    const newPos = moveBullet(
      this.localX,
      this.localY,
      this.vx,
      this.vy,
      deltaTime
    );
    this.localX = newPos.x;
    this.localY = newPos.y;

    // We don't send this over the network
    // because it's easy enough to calculate client side.
    this.x = Math.round(this.localX / SCALE_FACTOR);
    this.y = Math.round(this.localY / SCALE_FACTOR);
    this.checkCollision();
    /*
    this.setData(cache, {
      x: Math.round(this.localX / SCALE_FACTOR),
      y: Math.round(this.localY / SCALE_FACTOR)
    });
    */
  }

  public setPos(cache: Cache, x: number, y: number): void {
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    this.setData(cache, { x, y });
  }

  public setVelocity(cache: Cache, vx: number, vy: number): void {
    this.vx = Math.round(vx);
    this.vy = Math.round(vy);
    this.setData(cache, {
      clientVX: Math.round(this.vx / SCALE_FACTOR),
      clientVY: Math.round(this.vy / SCALE_FACTOR)
    });
  }

  public hit(se: SolidEntity): void {
    let rm: boolean = true;
    if (se instanceof Plane || se instanceof Man) {
      if (this.origin.getPlayerInfo().getId() == se.getPlayerInfo().getId()) {
        //rm = false;
      }
    }
    if (se instanceof Runway) {
      //console.log("WTF");
    }
    if (rm) {
      //if (se != null) console.log("hit");
      //console.log("rm");
      //this.world.submitBullet()
      this.world.removeEntity(this);
    }
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      age: this.age,
      x: this.x,
      y: this.y,
      clientVX: this.clientVX,
      clientVY: this.clientVY
    };
  }
}
