import { GameObject, GameObjectType } from "../object";
import { Cache, CacheEntry } from "../network/cache";
import { Team } from "../constants";

// Maximum explosion time.
export const EXPLOSION_TIME = 560;

export class Explosion extends GameObject {
  public type = GameObjectType.Explosion;
  public x: number;
  public y: number;
  public playerID: number;
  public team: number;

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

  public setTeam(cache: Cache, team: Team): void {
    this.set(cache, "team", team);
  }

  public setPlayerID(cache: Cache, id: number): void {
    this.set(cache, "playerID", id);
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
