import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";
import { Team, SCALE_FACTOR } from "../constants";
import { Vec2d } from "../physics/vector";
import { directionToRadians } from "../physics/helpers";

export const bulletGlobals = {
  speed: 300,
  lifetime: 2000, // milliseconds
  gravity: 425,
  drag: 0.005
};

export function moveBullet(
  localX: number,
  localY: number,
  dx: number,
  dy: number,
  deltaTime: number
): Vec2d {
  const tstep = deltaTime / 1000;
  return {
    x: localX + tstep * dx,
    y: localY + tstep * dy
  };
}

export function moveBomb(
  localX: number,
  localY: number,
  vx: number,
  vy: number,
  deltaTime: number
): Vec2d {
  const tstep = deltaTime / 1000;
  return {
    x: localX + tstep * vx,
    y: localY + tstep * vy
  }
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

  public setVelocity(cache: Cache, dx: number, dy: number): void {
    this.set(cache, "dx", dx);
    this.set(cache, "dy", dy);
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      age: this.age,
      x: this.x,
      y: this.y,
    };
  }
}

export class Bomb extends GameObject {
  public type = GameObjectType.Bomb;
  public age: number;
  public localX: number;
  public localY: number;
  public x: number;
  public y: number;
  public shotBy: number; // ID of player who shot it
  public team: Team; // team of player who shot it
  public vx: number;
  public vy: number;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.localX = 0;
    this.localY = 0;
    this.setData(cache, {
      age: 0,
      x: 0,
      y: 0,
      direction: 0,
    });
  }

  public tick(cache: Cache, deltaTime: number): void {
    this.move(cache, deltaTime);
    this.ageBomb(cache, deltaTime);
  }

  private ageBomb(cache: Cache, deltaTime: number): void {
    this.age += deltaTime;
  }

  public move(cache: Cache, deltaTime: number): void {
    // move the bomb...
    const dragForceX = bulletGlobals.drag * Math.pow(this.vx / SCALE_FACTOR, 2);
    const dragForceY = bulletGlobals.drag * Math.pow(this.vy / SCALE_FACTOR, 2);
    this.vx -= Math.sign(this.vx) * dragForceX;
    this.vy -= (Math.sign(this.vy) * dragForceY + bulletGlobals.gravity);

    const newPos = moveBomb(
      this.localX,
      this.localY,
      this.vx,
      this.vy,
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

  public setVelocity(cache: Cache, vx: number, vy: number): void {
    this.set(cache, "vx", vx);
    this.set(cache, "vy", vy);
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      age: this.age,
      x: this.x,
      y: this.y,
    };
  }
}