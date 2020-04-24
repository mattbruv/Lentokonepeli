import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";
import { Team, SCALE_FACTOR } from "../constants";

export const bulletGlobals = {
  speed: 500
};

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

  public constructor(id: number, cache: Cache) {
    super(id);
    this.localX = 0;
    this.localY = 0;
    this.setData(cache, {
      age: 0,
      x: 0,
      y: 0,
      speed: bulletGlobals.speed
    });
  }

  public setPos(cache: Cache, x: number, y: number): void {
    this.localX = x * SCALE_FACTOR;
    this.localY = y * SCALE_FACTOR;
    this.setData(cache, { x, y });
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
