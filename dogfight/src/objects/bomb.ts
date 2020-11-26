import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";
import { Team, SCALE_FACTOR } from "../constants";
import { radiansToDirection, directionToRadians } from "../physics/helpers";

export const bombGlobals = {
  gravity: 425,
  drag: 0.005,
  cooldown: 500
};

export class Bomb extends GameObject {
  public type = GameObjectType.Bomb;
  public age: number;
  public localX: number;
  public localY: number;
  public x: number;
  public y: number;
  public droppedBy: number; // ID of player who dropped it
  public team: Team; // team of player who dropped it

  public xSpeed: number;
  public ySpeed: number;
  public radians: number;
  public direction: number;

  public constructor(id: number, cache: Cache, droppedBy: number, team: Team) {
    super(id);
    this.radians = directionToRadians(0);
    this.localX = 0;
    this.localY = 0;
    this.xSpeed = 0;
    this.ySpeed = 0;
    this.setData(cache, {
      age: 0,
      x: 0,
      y: 0,
      direction: 0,
      droppedBy,
      team
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
    return;
    const tstep = deltaTime / 1000;
    this.localX += this.xSpeed;
    this.localY += this.ySpeed;
    this.xSpeed -= this.xSpeed * 0.01;
    this.ySpeed += 3.3333333333333335;
    this.radians = Math.atan2(this.ySpeed, this.xSpeed);

    this.setData(cache, {
      x: Math.round(this.localX / SCALE_FACTOR),
      y: Math.round(this.localY / SCALE_FACTOR),
      direction: radiansToDirection(this.radians)
    });
  }

  public setSpeed(cache: Cache, speed: number): void {
    this.xSpeed = Math.cos(this.radians) * speed * SCALE_FACTOR;
    this.ySpeed = Math.sin(this.radians) * speed * SCALE_FACTOR;
  }

  public setDirection(cache: Cache, dir: number): void {
    this.radians = directionToRadians(dir);
    this.set(cache, "direction", dir);
  }

  public setPos(cache: Cache, x: number, y: number): void {
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    console.log(this.localX / 100, this.localY / 100);
    this.setData(cache, { x, y });
    console.log(this.x, this.y);
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      age: this.age,
      x: this.x,
      y: this.y,
      direction: this.direction
    };
  }
}
