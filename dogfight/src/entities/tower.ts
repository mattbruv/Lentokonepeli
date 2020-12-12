import { FacingDirection, Terrain } from "../constants";
import { TypedEntity, EntityType } from "../TypedEntity";
import { Cache, CacheEntry } from "../network/cache";

export class Tower extends TypedEntity {
  public type = EntityType.ControlTower;

  public x: number;
  public y: number;
  public terrain: Terrain;
  public direction: FacingDirection;

  public constructor(id: number, cache: Cache) {
    super(id);
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
