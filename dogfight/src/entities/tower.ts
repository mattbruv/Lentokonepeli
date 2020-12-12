import { FacingDirection, Terrain } from "../constants";
import { Entity, EntityType } from "../entity";
import { Cache, CacheEntry } from "../network/cache";
import { GameWorld } from "../world/world";

export class Tower extends Entity {
  public type = EntityType.ControlTower;

  public x: number;
  public y: number;
  public terrain: Terrain;
  public direction: FacingDirection;

  public constructor(id: number, world: GameWorld, cache: Cache) {
    super(id, world);
    this.setData(cache, {
      x: 0,
      y: 0,
      terrain: Terrain.Normal,
      direction: FacingDirection.Right
    });
  }

  public getState(): CacheEntry {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      terrain: this.terrain,
      direction: this.direction
    };
  }
}
