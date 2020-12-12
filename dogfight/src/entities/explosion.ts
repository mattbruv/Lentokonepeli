import { Entity, EntityType } from "../entity";
import { Cache, CacheEntry } from "../network/cache";
import { Team } from "../constants";
import { GameWorld } from "../world/world";

export const explosionGlobals = {
  duration: 500, // damage duration in milliseconds
  despawnTime: 1000, // time before explosion entity despawns.
  damage: 25, // damage in HP from colliding with the explosion.
  radius: 35 // explosion radius
};

export class Explosion extends Entity {
  public type = EntityType.Explosion;
  public x: number;
  public y: number;
  public playerID: number;
  public team: number;

  // counter of how long explosion has been active
  public age: number;

  // Hash table to keep track of entities this has affected
  public affectedObjects = {};

  public constructor(id: number, world: GameWorld, cache: Cache, x: number, y: number) {
    super(id, world);
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
