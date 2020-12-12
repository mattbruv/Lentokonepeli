import { TypedEntity, EntityType } from "../TypedEntity";
import { Cache, CacheEntry } from "../network/cache";
import { Team, SCALE_FACTOR } from "../constants";
import { Vec2d } from "../physics/vector";

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

export class Bullet extends TypedEntity {
  public type = EntityType.Bullet;
  public age: number;
  public localX: number;
  public localY: number;
  public x: number;
  public y: number;
  public shotBy: number; // ID of player who shot it
  public team: Team; // team of player who shot it
  public vx: number;
  public vy: number;
  public clientVX: number;
  public clientVY: number;

  public constructor(id: number, cache: Cache, shotBy: number, team: Team) {
    super(id);
    this.localX = 0;
    this.localY = 0;
    this.vx = 0;
    this.vy = 0;
    this.clientVX = 0;
    this.clientVY = 0;
    this.setData(cache, {
      age: 0,
      shotBy,
      team
    });
  }

  public tick(cache: Cache, deltaTime: number): void {
    this.move(cache, deltaTime);
    this.ageBullet(cache, deltaTime);
  }

  private ageBullet(cache: Cache, deltaTime: number): void {
    this.age += deltaTime;
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
