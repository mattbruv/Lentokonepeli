import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";

// Maximum explosion time.
export const EXPLOSION_TIME = 560;

export class Explosion extends GameObject {
  public type = GameObjectType.Explosion;
  public x: number;
  public y: number;

  // counter of how long explosion has been active
  public age: number;

  public constructor(id: number, cache: Cache, x: number, y: number) {
    super(id);
    this.setData(cache, {
      x,
      y,
      age: 0
    });
  }

  public tick(cache: Cache, deltaTime: number): void {
    this.age += deltaTime;
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      age: this.age
    };
  }
}
