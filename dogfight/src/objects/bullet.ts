import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";
import { Team, SCALE_FACTOR } from "../constants";
import { Vec2d } from "../physics/vector";
import { directionToRadians } from "../physics/helpers";

export const bulletGlobals = {
  speed: 1000,
  lifetime: 2000 // milliseconds
};

export function moveBullet(
  localX: number,
  localY: number,
  speed: number,
  dx: number,
  dy: number,
  deltaTime: number
): Vec2d {
  const speedFactor = (deltaTime / 1000) * speed;
  return {
    x: localX + speed * dx,
    y: localY + speed * dy
  };
}

export class Bullet extends GameObject {
  public type = GameObjectType.Bullet;
  public age: number;
  public localX: number;
  public localY: number;
  public x: number;
  public y: number;
  public shotBy: number; // ID of player who shot it
  public team: Team; // team of player who shot it
  public speed: number;
  public dx: number;
  public dy: number;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.localX = 0;
    this.localY = 0;
    this.setData(cache, {
      age: 0,
      x: 0,
      y: 0,
      direction: 0,
      speed: bulletGlobals.speed
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
    // move the bullet...
    const newPos = moveBullet(
      this.localX,
      this.localY,
      this.speed,
      this.dx,
      this.dy,
      deltaTime
    );

    this.localX = newPos.x;
    this.localY = newPos.y;

    this.setData(cache, {
      x: Math.round(this.localX / SCALE_FACTOR),
      y: Math.round(this.localY / SCALE_FACTOR)
    });
  }

  public setPos(cache: Cache, x: number, y: number): void {
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    this.setData(cache, { x, y });
  }

  public setSpeed(cache: Cache, newSpeed: number): void {
    this.set(cache, "speed", newSpeed);
  }

  public setUnitVelocity(cache: Cache, dx: number, dy: number): void {
    this.set(cache, "dx", dx);
    this.set(cache, "dy", dy);
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      age: this.age,
      x: this.x,
      y: this.y,
      speed: this.speed
    };
  }
}
